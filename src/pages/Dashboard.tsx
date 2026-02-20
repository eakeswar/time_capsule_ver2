
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { FileItem } from "@/components/FileCard";
import { ScheduleFormData } from "@/components/ScheduleForm";
import { useAuth } from "@/context/AuthContext";
import { getScheduledFiles, scheduleFile, updateScheduledFile, deleteScheduledFile, triggerFileSending } from "@/services/fileService";
import { handleError } from "@/utils/errorHandler";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FilterBar from "@/components/dashboard/FilterBar";
import StatusTabs from "@/components/dashboard/StatusTabs";
import ScheduleFileDialog from "@/components/dashboard/ScheduleFileDialog";
import { usePendingFileChecker } from "@/hooks/usePendingFileChecker";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useFileFiltering } from "@/hooks/useFileFiltering";

const Dashboard = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const fetchAttemptRef = useRef(0);
  const hasUserCheckedRef = useRef(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  const fetchFiles = useCallback(async () => {
    if (!user) {
      if (fetchAttemptRef.current > 5) {
        console.log("No user after multiple attempts, stopping fetch attempts");
        setIsLoading(false);
        return;
      }
      
      fetchAttemptRef.current += 1;
      console.log(`No user yet, attempt ${fetchAttemptRef.current}`);
      return;
    }
    
    hasUserCheckedRef.current = true;
    
    try {
      console.log("Fetching scheduled files");
      const data = await getScheduledFiles();
      console.log("Fetched files:", data);
      
      setFiles(data);
      setInitialLoadComplete(true);
    } catch (error) {
      handleError(error, "Failed to load your files", {
        context: "dashboard"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  // Use our custom hooks
  const { filteredFiles, setFilteredFiles } = useFileFiltering(
    files, 
    searchQuery, 
    statusFilter, 
    activeTab, 
    initialLoadComplete
  );

  const { checkAndTriggerPendingFiles } = usePendingFileChecker(
    files, 
    user, 
    initialLoadComplete, 
    fetchFiles
  );

  const { setupRealtimeSubscription } = useRealtimeSubscription(user, fetchFiles);
  
  const setupRefreshListener = useCallback(() => {
    const handleRefresh = () => {
      console.log("Refresh file list triggered");
      fetchFiles();
    };
    
    window.addEventListener('refresh-file-list', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-file-list', handleRefresh);
    };
  }, [fetchFiles]);

  useEffect(() => {
    console.log("Main effect running, user:", user ? "exists" : "null");
    
    if (!isLoading && !hasUserCheckedRef.current && user) {
      console.log("User available but haven't loaded yet, starting load");
      setIsLoading(true);
    }
    
    if (isLoading && user) {
      fetchFiles();
    }
  }, [user, isLoading, fetchFiles]);
  
  useEffect(() => {
    if (!user) return;
    
    const cleanupRefresh = setupRefreshListener();
    
    return () => {
      if (cleanupRefresh) cleanupRefresh();
    };
  }, [user, setupRefreshListener]);
  
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };
  
  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
  };

  const handleNewSchedule = async (formData: ScheduleFormData) => {
    if (!formData.file) return;
    
    try {
      console.log("Scheduling new file with date:", formData.scheduledDate);
      console.log("Date timestamp:", formData.scheduledDate.getTime());
      console.log("ISO string:", formData.scheduledDate.toISOString());
      
      await scheduleFile({
        file: formData.file,
        recipient: formData.recipient,
        scheduledDate: formData.scheduledDate
      });
      
      setIsDialogOpen(false);
      setTimeout(() => {
        fetchFiles();
      }, 1000);
    } catch (error) {
      handleError(error, "Error scheduling file", {
        context: "file-scheduler"
      });
    }
  };
  
  const handleEditSchedule = async (formData: ScheduleFormData) => {
    if (!formData.id) return;
    
    try {
      console.log("Updating schedule with date:", formData.scheduledDate);
      console.log("Date timestamp:", formData.scheduledDate.getTime());
      console.log("ISO string:", formData.scheduledDate.toISOString());
      
      await updateScheduledFile({
        id: formData.id,
        recipient: formData.recipient,
        scheduledDate: formData.scheduledDate
      });
      
      setEditingFile(null);
      setIsDialogOpen(false);
      setTimeout(() => {
        fetchFiles();
      }, 1000);
    } catch (error) {
      handleError(error, "Error updating file schedule", {
        context: "file-scheduler"
      });
    }
  };
  
  const handleDeleteFile = async (id: string) => {
    try {
      await deleteScheduledFile(id);
      setFiles(prev => prev.filter(file => file.id !== id));
    } catch (error) {
      handleError(error, "Error deleting file", {
        context: "file-manager"
      });
    }
  };
  
  const handleEditFile = (id: string) => {
    const fileToEdit = files.find(file => file.id === id);
    if (fileToEdit) {
      setEditingFile(fileToEdit);
      setIsDialogOpen(true);
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleManualTrigger = async () => {
    try {
      setIsLoading(true);
      await triggerFileSending();
      setTimeout(() => {
        fetchFiles();
      }, 4000);
    } catch (error) {
      handleError(error, "Error triggering file sending", {
        context: "manual-trigger"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openNewScheduleDialog = () => {
    setEditingFile(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      <main className="container-custom pt-24">
        <DashboardHeader 
          onNewSchedule={openNewScheduleDialog} 
          onManualTrigger={handleManualTrigger}
          isLoading={isLoading}
        />
        
        <FilterBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          clearAllFilters={clearAllFilters}
        />
        
        <StatusTabs 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isLoading={isLoading}
          filteredFiles={filteredFiles}
          onOpenDialog={openNewScheduleDialog}
          onDeleteFile={handleDeleteFile}
          onEditFile={handleEditFile}
        />
      </main>
      
      <ScheduleFileDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingFile ? handleEditSchedule : handleNewSchedule}
        editingFile={editingFile}
      />
    </div>
  );
};

export default Dashboard;
