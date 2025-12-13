import { useState, useEffect } from 'react';
import { CheckCircle, Download, FileText } from 'lucide-react';
import ChatCanvas from './ChatCanvas';
import { debriefApi } from '../services/api';

interface Source {
  title: string;
  url?: string;
  excerpt?: string;
}

interface MatrixDebriefProps {
  project: any;
  onApprove: () => void;
  onPrint: () => void;
  onDownload: () => void;
}

export default function MatrixDebrief({
  project,
  onApprove,
  onPrint,
  onDownload,
}: MatrixDebriefProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [, setLoadingSources] = useState(true);

  // Load sources on mount
  useEffect(() => {
    loadSources();
  }, [project.id]);

  const loadSources = async () => {
    try {
      const response = await debriefApi.getSources(project.id);
      setSources(response.data.sources || []);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoadingSources(false);
    }
  };

  // Get matrix content from workflow steps
  const matrixContent = project.workflowSteps
    ?.find((s: any) => s.step === 'create_program_matrix' || s.step === 'create_program_design')
    ?.result || 'Matrisen har inte skapats an...';

  // Handle chat messages
  const handleSendMessage = async (message: string): Promise<string> => {
    let fullResponse = '';
    await debriefApi.chat(project.id, message, (chunk) => {
      fullResponse += chunk;
    });
    return fullResponse;
  };

  // If matrix is already approved, show simple view
  if (project.programMatrix?.approved) {
    return (
      <div className="space-y-6">
        {/* Approved Banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">
                Programmatrisen ar godkand. Redo att skapa innehall.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onPrint}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Skriv ut/PDF
              </button>
              <button
                onClick={onDownload}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <FileText className="w-4 h-4" />
                Ladda ner
              </button>
            </div>
          </div>
        </div>

        {/* Simple Matrix View */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{
            __html: matrixContent.replace(/\n/g, '<br/>')
          }} />
        </div>
      </div>
    );
  }

  // Show Chat + Canvas layout for review
  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[#1d1d1f]">Granska programmatrisen</h3>
          <p className="text-sm text-[#86868b]">
            Stall fragor eller ge feedback innan du godkanner.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPrint}
            className="px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Skriv ut
          </button>
          <button
            onClick={onDownload}
            className="px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            Ladda ner
          </button>
        </div>
      </div>

      {/* Chat + Canvas */}
      <ChatCanvas
        title="Programmatris"
        subtitle={`${project.chapters?.length || 0} kapitel, ${project.chapters?.reduce((sum: number, c: any) => sum + (c.sessions?.length || 0), 0) || 0} sessioner`}
        canvasContent={matrixContent}
        sources={sources}
        onSendMessage={handleSendMessage}
        onApprove={onApprove}
        approveLabel="Godkann programmatris"
        initialMessages={[
          {
            id: 'welcome',
            role: 'assistant',
            content: `Jag har skapat en programmatris for "${project.name}". Den innehaller ${project.chapters?.length || 0} kapitel med totalt ${project.chapters?.reduce((sum: number, c: any) => sum + (c.sessions?.length || 0), 0) || 0} sessioner.\n\nGranska innehallet till hoger och stall garna fragor om du undrar over nagon del av strukturen eller innehallet.`,
            timestamp: new Date(),
          },
        ]}
      />
    </div>
  );
}
