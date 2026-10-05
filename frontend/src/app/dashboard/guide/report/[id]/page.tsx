import Link from "next/link";
import { ArrowLeft, AlertOctagon, CheckCircle2, Copy } from "lucide-react";

export default function PlagiarismReport() {
  // Mock data representing what the Celery task would return
  const reportData = {
    studentName: "Jane Doe",
    projectTitle: "Methodology Draft",
    overallScore: 42.5,
    status: "Review Required",
    matches: [
      {
        id: 1,
        similarity: 92,
        studentText: "The primary objective of this research is to evaluate the efficacy of deep convolutional networks in identifying early-stage melanoma.",
        sourceText: "This study aims to assess the effectiveness of deep convolutional neural networks for the early detection of melanoma.",
        sourceInfo: "Journal of Medical AI, 2024"
      },
      {
        id: 2,
        similarity: 85,
        studentText: "Data preprocessing involved resizing all images to 256x256 pixels and normalizing pixel values between 0 and 1.",
        sourceText: "All dataset images were resized to 256x256 and normalized to a [0, 1] range during the preprocessing phase.",
        sourceInfo: "Student Thesis Corpus: ID-8942"
      }
    ]
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/guide" className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Plagiarism Report</h1>
          <p className="text-gray-500">{reportData.studentName} — {reportData.projectTitle}</p>
        </div>
      </div>

      {/* Score Overview */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-red-100">
            {/* Visual circle indicating score */}
            <div className="absolute inset-0 rounded-full border-8 border-red-500 border-t-transparent -rotate-45"></div>
            <div className="text-center">
              <span className="text-4xl font-extrabold text-gray-800">{reportData.overallScore}%</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-red-600 flex items-center">
              <AlertOctagon className="w-6 h-6 mr-2" />
              High Similarity Detected
            </h2>
            <p className="text-gray-600 mt-2 max-w-md">
              The AI engine detected significant semantic similarities with existing academic works and our internal corpus. Please review the highlighted chunks manually.
            </p>
          </div>
        </div>
        
        <div className="mt-6 md:mt-0 flex flex-col space-y-3">
          <button className="px-6 py-3 bg-red-50 text-red-700 font-semibold rounded-xl border border-red-200 hover:bg-red-100 transition-colors">
            Reject Submission
          </button>
          <button className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            Approve with Warning
          </button>
        </div>
      </div>

      {/* Side-by-Side Match Viewer */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">Semantic Matches ({reportData.matches.length})</h3>
        
        {reportData.matches.map((match) => (
          <div key={match.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-slate-900 px-4 py-3 flex justify-between items-center text-white">
              <div className="flex items-center space-x-2">
                <span className="bg-red-500 px-2 py-1 rounded text-xs font-bold">{match.similarity}% Match</span>
                <span className="text-sm text-slate-300">Found in: {match.sourceInfo}</span>
              </div>
              <Copy className="w-4 h-4 text-slate-400 hover:text-white cursor-pointer" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="p-6 bg-red-50/30">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Student Draft</p>
                <p className="text-gray-800 leading-relaxed font-medium bg-red-100/50 p-2 rounded">
                  {match.studentText}
                </p>
              </div>
              <div className="p-6 bg-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Original Source</p>
                <p className="text-gray-600 leading-relaxed italic">
                  "{match.sourceText}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
