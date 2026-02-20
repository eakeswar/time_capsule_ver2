
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import ScheduleForm, { ScheduleFormData } from "@/components/ScheduleForm";
import { FileItem } from "@/components/FileCard";
import { logDateDetails } from "@/utils/dateDebugger";

interface ScheduleFileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: ScheduleFormData) => void;
  editingFile: FileItem | null;
}

const ScheduleFileDialog = ({
  isOpen,
  onOpenChange,
  onSubmit,
  editingFile
}: ScheduleFileDialogProps) => {
  const isMobile = useIsMobile();
  
  // When editing a file, ensure the date is properly formatted as a Date object
  const editingData = editingFile ? {
    id: editingFile.id,
    name: editingFile.name,
    recipient: editingFile.recipient,
    scheduledDate: new Date(editingFile.scheduledDate)
  } : null;

  // Add debugging for scheduledDate if available
  if (editingFile?.scheduledDate) {
    const dateObj = new Date(editingFile.scheduledDate);
    logDateDetails(dateObj, "EditingFile scheduled date in dialog");
    console.log("EditingFile original scheduledDate:", editingFile.scheduledDate);
    console.log("EditingFile parsed as ISO:", dateObj.toISOString());
  }

  const title = editingFile ? "Edit Scheduled File" : "Schedule New File";
  const description = editingFile 
    ? "Update the recipient and schedule for this file." 
    : "Upload a file and set when it should be delivered.";

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-background text-foreground border-border max-h-[90vh]">
          <DrawerHeader className="pb-4">
            <DrawerTitle className="text-foreground">
              {title}
            </DrawerTitle>
            <DrawerDescription>
              {description}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            <ScheduleForm 
              onSubmit={onSubmit}
              editingFile={editingData}
              isMobile={true}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <ScheduleForm 
          onSubmit={onSubmit}
          editingFile={editingData}
          isMobile={false}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleFileDialog;
