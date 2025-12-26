import React, { useState } from 'react';
import { Download, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFViewerProps {
  url: string;
  title?: string;
  className?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, title, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Check if the URL is a PDF
  const isPDF = url.toLowerCase().endsWith('.pdf') || url.includes('pdf');

  if (!isPDF) {
    return (
      <div className={`border border-border rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {title || 'Fichier disponible'}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ouvrir
            </Button>
            <a
              href={url}
              download
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`border border-border rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Impossible d'afficher l'aperçu du PDF
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ouvrir dans un nouvel onglet
            </Button>
            <a
              href={url}
              download
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-border rounded-xl overflow-hidden ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
        <span className="text-sm font-medium text-foreground truncate">
          {title || 'Aperçu PDF'}
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Réduire' : 'Agrandir'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(url, '_blank')}
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <a
            href={url}
            download
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
            title="Télécharger"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* PDF iframe */}
      <div className={`transition-all duration-300 ${isExpanded ? 'h-[80vh]' : 'h-[400px]'}`}>
        <iframe
          src={`${url}#toolbar=1&navpanes=0`}
          className="w-full h-full border-0"
          title={title || 'PDF Viewer'}
          onError={() => setHasError(true)}
        />
      </div>
    </div>
  );
};

export default PDFViewer;
