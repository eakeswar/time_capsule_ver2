
// Main file service that re-exports all functionality
import { scheduleFile, updateScheduledFile, deleteScheduledFile, getScheduledFiles } from "./file/fileOperations";
import { uploadFile, getFilePreviewUrl, getFilePreviewByStoragePath } from "./file/fileStorage";
import { getFileByToken } from "./file/fileAccess";
import { triggerFileSending } from "./file/fileTrigger";
import type { ScheduleFileParams, UpdateScheduleParams } from "./file/fileOperations";

export {
  // File operations
  scheduleFile,
  updateScheduledFile,
  deleteScheduledFile,
  getScheduledFiles,
  
  // File storage
  uploadFile,
  getFilePreviewUrl,
  getFilePreviewByStoragePath,
  
  // File access
  getFileByToken,
  
  // File triggering
  triggerFileSending,
  
  // Types
  type ScheduleFileParams,
  type UpdateScheduleParams
};
