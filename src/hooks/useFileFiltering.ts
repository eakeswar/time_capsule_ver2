
import { useEffect, useState, useMemo } from "react";
import { FileItem } from "@/components/FileCard";
import { logDebug } from "@/utils/errorHandler";

/**
 * Hook for filtering files based on search query, status filter, and active tab
 */
export function useFileFiltering(
  files: FileItem[],
  searchQuery: string,
  statusFilter: string[],
  activeTab: string,
  initialLoadComplete: boolean
) {
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  
  // Use useMemo to optimize filtering performance
  const computedFilteredFiles = useMemo(() => {
    if (!initialLoadComplete) return [];
    
    let filtered = [...files];
    
    // First filter by tab (most restrictive)
    if (activeTab === "pending") {
      filtered = filtered.filter(file => file.status === "pending");
    } else if (activeTab === "sent") {
      filtered = filtered.filter(file => file.status === "sent");
    } else if (activeTab === "failed") {
      filtered = filtered.filter(file => file.status === "failed");
    }
    
    // Then filter by status if specified
    if (statusFilter.length > 0) {
      filtered = filtered.filter(file => statusFilter.includes(file.status));
    }
    
    // Lastly filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        file => 
          file.name.toLowerCase().includes(query) || 
          file.recipient.toLowerCase().includes(query)
      );
    }
    
    // Log filtering debug info in development only
    if (process.env.NODE_ENV !== 'production') {
      logDebug(`Filtered ${files.length} files to ${filtered.length}`, "file-filtering", {
        activeTab,
        statusFilter,
        searchQuery
      });
    }
    
    return filtered;
  }, [files, searchQuery, statusFilter, activeTab, initialLoadComplete]);
  
  useEffect(() => {
    setFilteredFiles(computedFilteredFiles);
  }, [computedFilteredFiles]);
  
  return { filteredFiles, setFilteredFiles };
}
