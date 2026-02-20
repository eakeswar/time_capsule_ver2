
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Calendar as CalendarIcon, Clock, Mail } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { logDateDetails } from "@/utils/dateDebugger";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import FileUpload from "./FileUpload";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface ScheduleFormProps {
  onSubmit: (data: ScheduleFormData) => void;
  editingFile?: {
    id: string;
    name: string;
    recipient: string;
    scheduledDate: Date;
  } | null;
  isMobile?: boolean;
}

export interface ScheduleFormData {
  id?: string;
  file?: File;
  recipient: string;
  scheduledDate: Date;
  scheduledTime: string;
}

const ScheduleForm = ({ onSubmit, editingFile = null, isMobile = false }: ScheduleFormProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [date, setDate] = useState<Date | undefined>(() => {
    if (editingFile?.scheduledDate) {
      const dateObj = new Date(editingFile.scheduledDate);
      logDateDetails(dateObj, "Initial date from editingFile");
      return dateObj;
    }
    return undefined;
  });
  
  const { toast } = useToast();
  
  const defaultTime = editingFile?.scheduledDate 
    ? format(new Date(editingFile.scheduledDate), "HH:mm") 
    : "";

  useEffect(() => {
    if (editingFile?.scheduledDate) {
      const dateObj = new Date(editingFile.scheduledDate);
      logDateDetails(dateObj, "Updated date from editingFile");
      setDate(dateObj);
    }
  }, [editingFile]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ScheduleFormData>({
    defaultValues: {
      recipient: editingFile?.recipient || "",
      scheduledTime: defaultTime
    }
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const selectedNameRef = useRef<HTMLSpanElement | null>(null);
  const editingNameRef = useRef<HTMLSpanElement | null>(null);
  const [isSelectedNameTruncated, setIsSelectedNameTruncated] = useState(false);
  const [isEditingNameTruncated, setIsEditingNameTruncated] = useState(false);

  const measureTruncation = () => {
    const selectedEl = selectedNameRef.current;
    const editingEl = editingNameRef.current;

    if (selectedEl) {
      setIsSelectedNameTruncated(selectedEl.scrollWidth > selectedEl.clientWidth);
    }
    if (editingEl) {
      setIsEditingNameTruncated(editingEl.scrollWidth > editingEl.clientWidth);
    }
  };

  useLayoutEffect(() => {
    measureTruncation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile?.name, editingFile?.name, isMobile]);

  useEffect(() => {
    window.addEventListener("resize", measureTruncation);
    return () => window.removeEventListener("resize", measureTruncation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text;
    const filename = text.split('/').pop() || text;
    
    if (filename.length <= maxLength) return filename;
    
    const extension = filename.includes('.') ? filename.split('.').pop() || '' : '';
    const name = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
    
    const truncatedName = extension 
      ? name.substring(0, maxLength - extension.length - 4) + '...' 
      : name.substring(0, maxLength - 3) + '...';
    
    return extension ? `${truncatedName}.${extension}` : truncatedName;
  };

  const processSubmit = (data: ScheduleFormData) => {
    if (!date) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a date"
      });
      return;
    }

    if (!selectedFile && !editingFile) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please upload a file"
      });
      return;
    }

    const [hours, minutes] = data.scheduledTime.split(":").map(Number);
    
    const scheduledDateTime = new Date(date);
    scheduledDateTime.setHours(hours, minutes, 0, 0);
    logDateDetails(scheduledDateTime, "Final scheduled date before submission");
    console.log("ISO string to submit:", scheduledDateTime.toISOString());

    const currentTime = new Date();
    logDateDetails(currentTime, "Current time for comparison");
    
    if (scheduledDateTime.getTime() < currentTime.getTime()) {
      console.log("Warning: Selected time is in the past");
      
      toast({
        title: "Notice",
        description: "Selected time is in the past - file will be sent immediately",
        duration: 5000
      });
    }

    const formData: ScheduleFormData = {
      recipient: data.recipient,
      scheduledDate: scheduledDateTime,
      scheduledTime: data.scheduledTime,
    };
    
    console.log("Submitting scheduled date:", scheduledDateTime.toISOString());
    console.log("Date timestamp:", scheduledDateTime.getTime());

    if (editingFile) {
      formData.id = editingFile.id;
    } else if (selectedFile) {
      formData.file = selectedFile;
    }
    
    onSubmit(formData);
    
    if (!editingFile) {
      setSelectedFile(null);
      setDate(undefined);
      reset();
    }
  };

  const formSpacing = isMobile ? "space-y-4" : "space-y-6";
  const gridClass = isMobile ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 md:grid-cols-2 gap-4";

  return (
    <form onSubmit={handleSubmit(processSubmit)} className={formSpacing}>
      {!editingFile && (
        <div className="space-y-2">
          <Label>File</Label>
          <FileUpload onFileSelect={handleFileSelect} />
          {selectedFile && (
            <div className="mt-2 text-sm text-muted-foreground">
              <TooltipProvider>
                {isSelectedNameTruncated ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex-shrink-0">Selected:</span>
                        <span
                          ref={selectedNameRef}
                          className="font-medium truncate min-w-0 max-w-[220px] sm:max-w-[280px] md:max-w-[320px]"
                        >
                          {selectedFile.name}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-80">
                      <p className="break-all">{selectedFile.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex-shrink-0">Selected:</span>
                    <span
                      ref={selectedNameRef}
                      className="font-medium truncate min-w-0 max-w-[220px] sm:max-w-[280px] md:max-w-[320px]"
                    >
                      {selectedFile.name}
                    </span>
                  </div>
                )}
              </TooltipProvider>
            </div>
          )}
        </div>
      )}
      {editingFile && (
        <div className="space-y-2">
          <Label>File</Label>
          <TooltipProvider>
            {isEditingNameTruncated ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 border border-input rounded-md bg-muted/30 text-sm w-full overflow-hidden">
                    <span
                      ref={editingNameRef}
                      className="block truncate max-w-[260px] sm:max-w-[320px] md:max-w-full"
                    >
                      {editingFile.name}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-80">
                  <p className="break-all">{editingFile.name}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="p-2 border border-input rounded-md bg-muted/30 text-sm w-full overflow-hidden">
                <span
                  ref={editingNameRef}
                  className="block truncate max-w-[260px] sm:max-w-[320px] md:max-w-full"
                >
                  {editingFile.name}
                </span>
              </div>
            )}
          </TooltipProvider>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="recipient">Recipient Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="recipient"
            placeholder="recipient@example.com"
            className="pl-10"
            {...register("recipient", { 
              required: "Recipient email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            })}
          />
        </div>
        {errors.recipient && (
          <p className="text-sm text-destructive">{errors.recipient.message}</p>
        )}
      </div>

      <div className={gridClass}>
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover text-popover-foreground" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduledTime">Time</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="scheduledTime"
              type="time"
              className="pl-10"
              {...register("scheduledTime", { 
                required: "Time is required" 
              })}
            />
          </div>
          {errors.scheduledTime && (
            <p className="text-sm text-destructive">{errors.scheduledTime.message}</p>
          )}
        </div>
      </div>

      <div className={isMobile ? "pt-2" : ""}>
        <Button type="submit" className="w-full">
          {editingFile ? "Update Schedule" : "Schedule Delivery"}
        </Button>
      </div>
    </form>
  );
};

export default ScheduleForm;
