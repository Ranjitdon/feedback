import React from "react";
import { useLocation } from "react-router-dom";
import {
  BarChart3,
  Target,
  TrendingUp,
  ScrollText,
  CheckCircle2,
  FileText,
  Bot,
  Mail,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import emailjs from "emailjs-com";

interface FeedbackData {
  relevance: string;
  evaluation_score: number;
  overall_feedback: string;
  plagiarism: number;
  readability_score?: number;
  readability_score_?: number;
  cosine_score: number;
  jaccard_index: number;
  ai_text: string;
}

const Feedback: React.FC = () => {
  const location = useLocation();
  const { title, content, ai_generated, feedback } = location.state || {
    title: "",
    content: "",
    ai_generated: "",
    feedback: null,
  };

  const handleEmailFeedback = () => {
    if (!feedback) {
      console.error("No feedback data available.");
      return;
    }
  
    const emailParams = {
      subject: "Assignment Feedback Analysis",
      title: title,
      recipient_email: "mandip.bhattarai22@pccoepune.org", // Change to dynamic recipient if needed
      readability_score: `${feedback?.readability_score || feedback?.readability_score_ || 0}%`,
      relevance_score: `${feedback.relevance.toUpperCase() || "N/A"}`,
      cosine_score: `${(feedback?.cosine_score * 100).toFixed(1)}%`,
      jaccard_index: `${(feedback?.jaccard_index * 100).toFixed(1)}%`,
      plagiarism: `${(feedback?.plagiarism * 100).toFixed(1)}%`,
      overall_feedback: feedback?.overall_feedback || "No detailed feedback provided.",
      timestamp: new Date().toISOString(),
    };
  
    emailjs
      .send(
        import.meta.env.VITE_EMAIL_JS_SERVICE_ID,
        import.meta.env.VITE_EMAIL_JS_TEMPLATE_ID,
        emailParams,
        import.meta.env.VITE_EMAIL_JS_CLIENT_ID
      )
      .then((response) => {
        console.log("✅ Email sent successfully:", response);
        
      })
      .catch((error) => {
        console.error("❌ Email sending failed:", error);
        alert("Failed to send feedback email.");
      });
  };
  

  if (!feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Navbar />
        <main className="pt-20 pb-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-10">
                Error: No feedback data available.
              </h1>
              <p className="text-gray-600 mb-8">
                Please ensure that the document has been processed correctly.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const readabilityScore = feedback?.readability_score || feedback?.readability_score_ || 0;

  const metrics = [
    {
      icon: BarChart3,
      label: "Readability Score",
      value: `${readabilityScore.toFixed(1)}%`,
      color: "bg-indigo-600",
      percentage: readabilityScore,
      description: "Measures clarity and ease of understanding.",
    },
    {
      icon: Target,
      label: "Relevance Score",
      value: feedback.relevance.charAt(0).toUpperCase() + feedback.relevance.slice(1),
      color: "bg-purple-600",
      percentage: feedback.evaluation_score,
      description: "How well the content aligns with the title.",
    },
    {
      icon: TrendingUp,
      label: "Similarity Index (Cosine)",
      value: `${(feedback.cosine_score * 100).toFixed(1)}%`,
      color: "bg-blue-600",
      percentage: feedback.cosine_score * 100,
      description: "Content similarity assessment using cosine similarity.",
    },
    {
      icon: TrendingUp,
      label: "Similarity Index (Jaccard)",
      value: `${(feedback.jaccard_index * 100).toFixed(1)}%`,
      color: "bg-green-600",
      percentage: feedback.jaccard_index * 100,
      description: "Content similarity assessment using Jaccard index.",
    },
    {
      icon: CheckCircle2,
      label: "Plagiarism",
      value: `${(feedback.plagiarism * 100).toFixed(1)}%`,
      color: "bg-red-600",
      percentage: feedback.plagiarism * 100,
      description: "Percentage of similarity with other content indicating potential plagiarism.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Assignment Feedback Analysis
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Comprehensive evaluation metrics and insights for your submission
                </p>
              </div>
              <button
                onClick={handleEmailFeedback}
                className="flex items-center gap-2 px-4 py-2  bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium flex items-center justify-center disabled:opacity-50 hover:from-purple-700 hover:to-blue-700 transition-colors text-lg"
              >
                <Mail className="w-5 h-5" />
                <span>Email Feedback</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {metrics.map((metric, index) => (
                <MetricCard key={index} {...metric} />
              ))}
            </div>

            {/* Detailed Feedback */}
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <ScrollText className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Detailed Analysis
                </h2>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 border border-gray-200">
                <div className="prose prose-lg max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-700 font-sans leading-relaxed">
                    {feedback.overall_feedback}
                  </pre>
                </div>
              </div>
            </div>

            {/* Content Comparison Section */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Content Comparison
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Original Text */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Original Submission
                    </h3>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 h-[400px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                      {content}
                    </pre>
                  </div>
                </div>

                {/* AI Generated Content */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Bot className="w-6 h-6 text-purple-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      AI-Generated Version
                    </h3>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 h-[400px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                      {ai_generated}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  percentage: number;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  label,
  value,
  color,
  percentage,
  description,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
        <div className={`p-2 ${color} rounded-lg shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-3">{value}</div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
        <div
          className={`h-2.5 rounded-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

export default Feedback;