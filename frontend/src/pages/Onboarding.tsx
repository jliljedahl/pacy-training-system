import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight, Building2, Sparkles, Upload, MessageSquare, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Step = 'context-choice' | 'company-url' | 'company-result' | 'brief-choice';

interface CompanyData {
  company: {
    name: string;
    industry: string;
    description: string;
    website: string;
    size?: string;
    geography?: string;
  };
  brandVoice: {
    tone: string;
    keyThemes: string[];
    communicationStyle: string;
    language?: string;
  };
  audience: {
    type: string;
    segments: string[];
    typicalRoles?: string[];
  };
  trainingContext: {
    relevantTerminology: string[];
    industryContext: string;
    suggestedAngles: string[];
  };
  confidence: {
    overall: string;
  };
  notes?: string[];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { getAccessToken } = useAuth();

  const [step, setStep] = useState<Step>('context-choice');
  const [wantsBusinessContext, setWantsBusinessContext] = useState<boolean | null>(null);
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleContextChoice = (wantsContext: boolean) => {
    setWantsBusinessContext(wantsContext);
    if (wantsContext) {
      setStep('company-url');
    } else {
      sessionStorage.removeItem('companyContext');
      setStep('brief-choice');
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      // Skip URL analysis, go to brief choice
      setStep('brief-choice');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/onboarding/analyze-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to analyze company');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || 'Could not analyze website');
      }

      setCompanyData(data);
      sessionStorage.setItem('companyContext', JSON.stringify(data));
      setStep('company-result');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze company website');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSkipUrl = () => {
    setStep('brief-choice');
  };

  const handleBriefChoice = (choice: 'upload' | 'interview') => {
    if (choice === 'upload') {
      navigate('/create/upload-brief');
    } else {
      navigate('/create/interview');
    }
  };

  // Step indicators
  const steps = [
    { key: 'context', label: 'Kontext' },
    { key: 'brief', label: 'Brief' },
  ];
  const currentStepIndex =
    step === 'context-choice' || step === 'company-url' || step === 'company-result' ? 0 : 1;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-semibold text-[#1d1d1f] mb-3">
          Skapa nytt utbildningsprogram
        </h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-3 mb-10">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                i < currentStepIndex
                  ? 'bg-green-100 text-green-700'
                  : i === currentStepIndex
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < currentStepIndex ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="w-5 h-5 flex items-center justify-center">{i + 1}</span>
              )}
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-green-300' : 'bg-gray-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1a: Context Choice */}
      {step === 'context-choice' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-medium text-[#1d1d1f] mb-2">
              Ska utbildningen anpassas efter ett företags kontext?
            </h2>
            <p className="text-[#86868b]">
              Företagskontext gör utbildningen mer relevant med branschspecifika exempel och
              terminologi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleContextChoice(true)}
              className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 hover:border-[#007AFF] transition-all text-left group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Building2 className="w-6 h-6 text-[#007AFF]" />
              </div>
              <h3 className="font-semibold text-[#1d1d1f] mb-2">Ja, anpassa efter företag</h3>
              <p className="text-sm text-[#86868b]">
                Utbildningen anpassas med företagets bransch, värderingar och målgrupp.
              </p>
            </button>

            <button
              onClick={() => handleContextChoice(false)}
              className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 hover:border-[#007AFF] transition-all text-left group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-[#1d1d1f] mb-2">Nej, fristående utbildning</h3>
              <p className="text-sm text-[#86868b]">
                En generell utbildning utan specifik företagsanpassning.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Step 1b: Company URL Input */}
      {step === 'company-url' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-medium text-[#1d1d1f] mb-2">Ange företagets webbplats</h2>
            <p className="text-[#86868b]">
              Vi analyserar webbplatsen för att förstå bransch, målgrupp och tonalitet.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b] w-5 h-5" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder="exempel.se (valfritt)"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-[#fafafa] focus:bg-white focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition-all text-lg"
                  disabled={analyzing}
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-6 py-3.5 bg-[#007AFF] text-white rounded-xl font-medium hover:bg-[#0066d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Analyserar...
                  </>
                ) : url.trim() ? (
                  'Analysera'
                ) : (
                  'Fortsätt'
                )}
              </button>
            </div>

            {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep('context-choice')}
              className="text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            >
              Tillbaka
            </button>
            <button
              onClick={handleSkipUrl}
              className="text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            >
              Hoppa över, fortsätt utan URL
            </button>
          </div>
        </div>
      )}

      {/* Step 1c: Company Result */}
      {step === 'company-result' && companyData && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-[#007AFF]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[#1d1d1f]">{companyData.company.name}</h2>
                <p className="text-[#86868b]">{companyData.company.industry}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  companyData.confidence.overall === 'high'
                    ? 'bg-green-100 text-green-700'
                    : companyData.confidence.overall === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                {companyData.confidence.overall === 'high'
                  ? 'Hög'
                  : companyData.confidence.overall === 'medium'
                    ? 'Medel'
                    : 'Låg'}{' '}
                konfidens
              </span>
            </div>

            <p className="text-[#1d1d1f] mb-5 text-sm">{companyData.company.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[#f5f5f7] rounded-lg p-3">
                <span className="text-[#86868b] block mb-1">Målgrupp</span>
                <span className="font-medium text-[#1d1d1f]">{companyData.audience.type}</span>
              </div>
              <div className="bg-[#f5f5f7] rounded-lg p-3">
                <span className="text-[#86868b] block mb-1">Tonalitet</span>
                <span className="font-medium text-[#1d1d1f]">{companyData.brandVoice.tone}</span>
              </div>
            </div>
          </div>

          {companyData.brandVoice.keyThemes.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-medium text-[#1d1d1f] mb-3 text-sm">Nyckelbudskap</h3>
              <div className="flex flex-wrap gap-2">
                {companyData.brandVoice.keyThemes.slice(0, 5).map((theme, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-[#f5f5f7] rounded-full text-xs text-[#1d1d1f]"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setCompanyData(null);
                setUrl('');
                setStep('company-url');
              }}
              className="px-5 py-3 border border-gray-200 rounded-xl font-medium text-[#1d1d1f] hover:bg-gray-50 transition-colors text-sm"
            >
              Ändra
            </button>
            <button
              onClick={() => setStep('brief-choice')}
              className="flex-1 px-5 py-3 bg-[#007AFF] text-white rounded-xl font-medium hover:bg-[#0066d6] transition-colors flex items-center justify-center gap-2 text-sm"
            >
              Fortsätt
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Brief Choice */}
      {step === 'brief-choice' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-medium text-[#1d1d1f] mb-2">
              Hur vill du skapa din brief?
            </h2>
            <p className="text-[#86868b]">
              Briefen beskriver vad utbildningen ska uppnå och för vem den är.
            </p>
          </div>

          {/* Show company context badge if set */}
          {companyData && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {companyData.company.name}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleBriefChoice('upload')}
              className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 hover:border-[#007AFF] transition-all text-left group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-[#1d1d1f] mb-2">Ladda upp befintlig brief</h3>
              <p className="text-sm text-[#86868b]">
                Har du redan ett dokument som beskriver utbildningen? Ladda upp det.
              </p>
            </button>

            <button
              onClick={() => handleBriefChoice('interview')}
              className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 hover:border-[#007AFF] transition-all text-left group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-[#1d1d1f] mb-2">Skapa brief via intervju</h3>
              <p className="text-sm text-[#86868b]">
                Vår AI ställer frågor för att förstå dina utbildningsbehov.
              </p>
            </button>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() =>
                wantsBusinessContext ? setStep('company-result') : setStep('context-choice')
              }
              className="text-[#86868b] hover:text-[#1d1d1f] transition-colors text-sm"
            >
              Tillbaka
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
