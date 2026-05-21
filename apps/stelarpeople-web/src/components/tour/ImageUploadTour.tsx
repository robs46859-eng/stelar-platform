import { useRef, useState } from 'react';
import { api } from '../../lib/api.ts';

interface ImageAnalysisResult {
  tour_id: string;
  model: string;
  images: Array<{
    index: number;
    detected_type: string;
    building_style: string | null;
    condition_signals: string[];
    red_flags: string[];
    stock_photo_risk: number;
    cgi_artifact_risk: number;
    neighborhood_context: string | null;
    mismatch_with_listing: string[];
  }>;
  fraud_assessment: {
    overall_risk_score: number;
    risk_level: string;
    flags: Array<{ type: string; description: string; severity: string; recommendation: string }>;
    mismatch_signals: string[];
    verification_recommended: boolean;
  };
  enhancement_narrative: string;
  disclaimer: string;
}

interface Props {
  tourId: string;
  listingFacts?: Record<string, unknown>;
  onAnalysisComplete?: (result: ImageAnalysisResult) => void;
}

function riskColor(score: number): string {
  if (score < 0.2) return 'text-emerald-600';
  if (score < 0.5) return 'text-amber-600';
  return 'text-red-600';
}

function severityBg(severity: string): string {
  if (severity === 'critical') return 'bg-red-50 border-red-200 text-red-800';
  if (severity === 'high') return 'bg-orange-50 border-orange-200 text-orange-800';
  if (severity === 'medium') return 'bg-amber-50 border-amber-200 text-amber-800';
  return 'bg-slate-50 border-slate-200 text-slate-600';
}

export default function ImageUploadTour({ tourId, listingFacts = {}, onAnalysisComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    const accepted = Array.from(incoming)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 6);

    setFiles((prev) => [...prev, ...accepted].slice(0, 6));

    accepted.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setPreviews((prev) => [...prev, e.target!.result as string].slice(0, 6));
      };
      reader.readAsDataURL(f);
    });
  }

  async function runAnalysis() {
    if (!files.length) return;
    setAnalyzing(true);
    setError('');

    const images: Array<{ mime: string; data: string }> = await Promise.all(
      files.map(
        (f) =>
          new Promise<{ mime: string; data: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target!.result as string;
              const base64 = dataUrl.split(',')[1];
              resolve({ mime: f.type, data: base64 });
            };
            reader.readAsDataURL(f);
          }),
      ),
    );

    try {
      const res = await api.post<ImageAnalysisResult>('/api/tour/image-upload', {
        tour_id: tourId,
        listing_facts: listingFacts,
        images,
      });
      setResult(res);
      onAnalysisComplete?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Upload Property Photos</h3>
        <p className="text-xs text-slate-400">Up to 6 images · Gemini AI analysis</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="text-2xl mb-1">📸</div>
        <p className="text-sm text-slate-600">Drop photos here or click to browse</p>
        <p className="text-xs text-slate-400 mt-1">Interior, exterior, neighborhood — Gemini detects listing mismatches</p>
      </div>

      {/* Thumbnails */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
              <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  setPreviews((p) => p.filter((_, j) => j !== i));
                  setFiles((f) => f.filter((_, j) => j !== i));
                }}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Analyze button */}
      {files.length > 0 && !result && (
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {analyzing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing with Gemini…
            </span>
          ) : (
            `Analyze ${files.length} photo${files.length !== 1 ? 's' : ''} for fraud & condition`
          )}
        </button>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Fraud risk score */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Fraud Risk Score</span>
              <span className={`text-lg font-bold ${riskColor(result.fraud_assessment.overall_risk_score)}`}>
                {Math.round(result.fraud_assessment.overall_risk_score * 100)}/100
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full mb-2">
              <div
                className={`h-2 rounded-full ${
                  result.fraud_assessment.overall_risk_score < 0.2
                    ? 'bg-emerald-500'
                    : result.fraud_assessment.overall_risk_score < 0.5
                    ? 'bg-amber-400'
                    : 'bg-red-500'
                }`}
                style={{ width: `${result.fraud_assessment.overall_risk_score * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 capitalize">Risk level: {result.fraud_assessment.risk_level}</p>
          </div>

          {/* Fraud flags */}
          {result.fraud_assessment.flags.map((flag, i) => (
            <div key={i} className={`border rounded-lg px-4 py-3 text-sm ${severityBg(flag.severity)}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold capitalize">{flag.type.replace(/_/g, ' ')}</span>
                <span className="text-xs uppercase tracking-wide opacity-70">{flag.severity}</span>
              </div>
              <p className="text-xs mb-1">{flag.description}</p>
              <p className="text-xs opacity-75">→ {flag.recommendation}</p>
            </div>
          ))}

          {/* Enhancement narrative */}
          {result.enhancement_narrative && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-blue-700 mb-1">Gemini Analysis Summary</p>
              <p className="text-xs text-blue-800">{result.enhancement_narrative}</p>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-slate-400 text-center">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
