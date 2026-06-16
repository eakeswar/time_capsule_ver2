
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

interface FilePreviewProps {
  file: {
    name: string;
    type: string;
    url?: string;
  };
  isLoading: boolean;
}

const FilePreview = ({ file, isLoading }: FilePreviewProps) => {
  const [pdfBlobUrl, setPdfBlobUrl] = React.useState<string | null>(null);
  const [pdfLoadError, setPdfLoadError] = React.useState(false);
  const [isRenderingPdf, setIsRenderingPdf] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const preparePdfPreview = async () => {
      if (file.type !== 'application/pdf' || !file.url) {
        setPdfBlobUrl(null);
        setPdfLoadError(false);
        return;
      }

      try {
        setPdfLoadError(false);
        const response = await fetch(file.url);

        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);

        if (isMounted) {
          setPdfBlobUrl(objectUrl);
        }
      } catch (error) {
        console.error('Error preparing PDF preview:', error);
        if (isMounted) {
          setPdfBlobUrl(null);
          setPdfLoadError(true);
        }
      }
    };

    preparePdfPreview();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file.type, file.url]);

  React.useEffect(() => {
    let cancelled = false;

    const renderPdfToCanvas = async () => {
      if (file.type !== 'application/pdf' || !pdfBlobUrl || !canvasRef.current) return;

      try {
        setIsRenderingPdf(true);
        setPdfLoadError(false);

        const loadingTask = getDocument({ url: pdfBlobUrl });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        if (cancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Failed to create canvas context for PDF preview');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvas, canvasContext: context, viewport }).promise;
      } catch (error) {
        console.error('Error rendering PDF preview:', error);
        if (!cancelled) {
          setPdfLoadError(true);
        }
      } finally {
        if (!cancelled) {
          setIsRenderingPdf(false);
        }
      }
    };

    renderPdfToCanvas();

    return () => {
      cancelled = true;
    };
  }, [file.type, pdfBlobUrl]);

  if (isLoading) {
    return (
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading file preview...</p>
        </div>
      </DialogContent>
    );
  }

  if (!file.url) {
    return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{file.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6">
          <p className="text-muted-foreground text-center mb-4">
            This file hasn't been sent yet or preview is not available.
          </p>
        </div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{file.name}</DialogTitle>
      </DialogHeader>
      
      <div className="flex flex-col items-center justify-center">
        {file.type.startsWith('image/') && (
          <img 
            src={file.url} 
            alt={file.name} 
            className="max-w-full max-h-[60vh] object-contain rounded-md"
          />
        )}

        {file.type.startsWith('video/') && (
          <video 
            src={file.url} 
            controls 
            className="max-w-full max-h-[60vh]"
          >
            Your browser does not support the video tag.
          </video>
        )}

        {file.type.startsWith('audio/') && (
          <div className="w-full p-4">
            <audio src={file.url} controls className="w-full">
              Your browser does not support the audio tag.
            </audio>
          </div>
        )}

        {file.type === 'application/pdf' && (
          <div className="w-full space-y-3">
            {!pdfLoadError && (
              <div className="w-full h-[60vh] overflow-auto rounded-md border border-border bg-muted/20 flex items-center justify-center p-2">
                {isRenderingPdf ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Rendering PDF preview...</span>
                  </div>
                ) : (
                  <canvas ref={canvasRef} className="max-w-full h-auto" />
                )}
              </div>
            )}

            {(pdfLoadError || !pdfBlobUrl) && (
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-muted-foreground text-center mb-4">
                  In-app PDF preview is unavailable for this file in your browser.
                </p>
              </div>
            )}

            <div className="flex justify-center gap-2">
              <Button asChild variant="secondary">
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open PDF
                </a>
              </Button>
              <Button asChild>
                <a href={file.url} download={file.name}>
                  Download PDF
                </a>
              </Button>
            </div>
          </div>
        )}

        {!file.type.startsWith('image/') && 
         !file.type.startsWith('video/') && 
         !file.type.startsWith('audio/') && 
         file.type !== 'application/pdf' && (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-muted-foreground text-center mb-4">
              Preview not available for this file type ({file.type || 'unknown'}).
            </p>
            <Button asChild>
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in new tab
              </a>
            </Button>
          </div>
        )}
      </div>
    </DialogContent>
  );
};

export default FilePreview;
