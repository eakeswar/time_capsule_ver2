
import { useState, useRef, ChangeEvent, useEffect, useLayoutEffect } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";


interface FileUploadProps {
  onFileSelect: (file: File) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

const FileUpload = ({ 
  onFileSelect, 
  maxSizeMB = 10, 
  acceptedFormats = ["*"]
}: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const isFormatAccepted = (file: File): boolean => {
    if (acceptedFormats.includes("*")) return true;
    return acceptedFormats.some(format => {
      if (format.startsWith(".")) {
        return file.name.toLowerCase().endsWith(format.toLowerCase());
      } else {
        return file.type.includes(format);
      }
    });
  };

  const handleFile = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB`);
      return;
    }

    if (!isFormatAccepted(file)) {
      toast.error("File format not accepted");
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileNameRef = useRef<HTMLHeadingElement | null>(null);
  const [isFileNameTruncated, setIsFileNameTruncated] = useState(false);

  const measureFileName = () => {
    const el = fileNameRef.current;
    if (!el) return;
    setIsFileNameTruncated(el.scrollWidth > el.clientWidth);
  };

  useLayoutEffect(() => {
    measureFileName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile?.name]);

  useEffect(() => {
    window.addEventListener("resize", measureFileName);
    return () => window.removeEventListener("resize", measureFileName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-xl transition-all duration-200 ${
            dragActive 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/30 hover:border-primary/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <Upload className={`h-10 w-10 mb-3 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
            <h3 className="text-lg font-medium mb-1">Upload your file</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop or click to browse
            </p>
            <Button
              onClick={openFileSelector}
              type="button"
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/5"
            >
              Select File
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Maximum file size: {maxSizeMB}MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept={acceptedFormats.join(",")}
          />
        </div>
      ) : (
        <div className="border rounded-xl p-4">
          <div className="flex items-center">
            <div className="flex items-center justify-center rounded-lg bg-primary/10 h-10 w-10 mr-3 flex-shrink-0">
              <File className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <TooltipProvider>
                    {isFileNameTruncated ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 ref={fileNameRef} className="min-w-0 max-w-full font-medium truncate">
                            {selectedFile.name}
                          </h3>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-80">
                          <p className="break-all">{selectedFile.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <h3 ref={fileNameRef} className="min-w-0 max-w-full font-medium truncate">
                        {selectedFile.name}
                      </h3>
                    )}
                  </TooltipProvider>

                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={removeFile}
                  aria-label="Remove selected file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
