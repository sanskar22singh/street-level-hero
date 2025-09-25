import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Report } from '@/types';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  analysis?: {
    isFake: boolean;
    confidence: number;
    reasons: string[];
    suggestions: string[];
  };
}

interface ReportAnalysisChatbotProps {
  report: Report | null;
  onAnalysisComplete?: (analysis: ChatMessage['analysis']) => void;
  onClose?: () => void;
}

const ReportAnalysisChatbot: React.FC<ReportAnalysisChatbotProps> = ({
  report,
  onAnalysisComplete,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tunable weights to influence confidence dynamically via chat commands
  const [weights, setWeights] = useState({
    keywordPenalty: 35,
    shortDescPenalty: 25,
    detailedDescBoost: 10,
    repeatPenalty: 25,
    missingLocationPenalty: 20,
    locationBoost: 8,
    imageBoostPerImage: 8, // base per image, compounded with +10 baseline
    imageBaseBoost: 10,
    imageMaxBoost: 30,
    videoBoost: 12,
    recentPenalty: 5,
    fakePatternPenalty: 35,
    vocabGoodBoost: 8,
    vocabPoorPenalty: 10,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (report) {
      // Auto-analyze when a report is selected
      handleAutoAnalysis();
    }
  }, [report]);

  const analyzeReport = (report: Report): ChatMessage['analysis'] => {
    const reasons: string[] = [];
    const suggestions: string[] = [];

    // totalScore spans [-100, +100]; negative = fake, positive = real
    let totalScore = 0;

    const title = (report.title || '').toLowerCase();
    const description = (report.description || '').toLowerCase();
    const descLen = description.length;

    // Penalize suspicious keywords
    if (/(\btest\b|\bfake\b|\bspam\b)/.test(title + ' ' + description)) {
      totalScore -= weights.keywordPenalty;
      reasons.push('Contains suspicious keywords like "test", "fake", or "spam"');
    }

    // Description completeness
    if (descLen < 10) {
      totalScore -= weights.shortDescPenalty;
      reasons.push('Description is too short to be meaningful');
    } else if (descLen >= 150) {
      totalScore += weights.detailedDescBoost;
      reasons.push('Detailed description provided');
    }

    // Repeated character patterns (e.g., "aaaaa")
    if (/(.)\1{4,}/.test(description)) {
      totalScore -= weights.repeatPenalty;
      reasons.push('Contains repeated character patterns');
    }

    // Location validity
    if (!report.location?.address || report.location.address.trim().length < 5) {
      totalScore -= weights.missingLocationPenalty;
      reasons.push('Invalid or missing location information');
    } else {
      totalScore += weights.locationBoost;
      reasons.push('Location information present');
    }

    // Media-based confidence: images/videos strongly increase legitimacy
    const imageCount = Array.isArray(report.images) ? report.images.length : 0;
    const videoCount = Array.isArray(report.videos) ? report.videos.length : 0;
    if (imageCount === 0 && videoCount === 0) {
      totalScore -= weights.shortDescPenalty - 5; // small penalty for no media
      reasons.push('No supporting media provided');
    } else {
      if (imageCount > 0) {
        const imgBoost = Math.min(
          weights.imageMaxBoost,
          weights.imageBaseBoost + imageCount * weights.imageBoostPerImage
        );
        totalScore += imgBoost;
        reasons.push(`${imageCount} image(s) attached (+${imgBoost})`);
      }
      if (videoCount > 0) {
        totalScore += weights.videoBoost;
        reasons.push('Video evidence attached (+12)');
      }
    }

    // Timing patterns (very recent could be automation, small penalty)
    const submitTime = new Date(report.submittedAt);
    const hoursDiff = (Date.now() - submitTime.getTime()) / (1000 * 60 * 60);
    if (hoursDiff < 0.1) {
      totalScore -= weights.recentPenalty;
      reasons.push('Report submitted very recently (possible automation)');
    }

    // Common fake text patterns
    const commonFakePatterns = ['asdf', 'qwerty', '12345', 'lorem ipsum', 'this is a test', 'fake report', 'spam'];
    if (commonFakePatterns.some(p => title.includes(p) || description.includes(p))) {
      totalScore -= weights.fakePatternPenalty;
      reasons.push('Contains common fake report patterns');
    }

    // Simple grammar signal: proportion of long words
    const words = description.split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      const longWords = words.filter(w => w.replace(/[^a-z]/g, '').length >= 6).length;
      const longRatio = longWords / words.length;
      if (longRatio >= 0.25) {
        totalScore += weights.vocabGoodBoost;
        reasons.push('Text shows reasonable vocabulary');
      } else if (longRatio < 0.05) {
        totalScore -= weights.vocabPoorPenalty;
        reasons.push('Very simple wording (possible low-effort report)');
      }
    }

    // Clamp total score
    totalScore = Math.max(-100, Math.min(100, totalScore));

    // Confidence = strength of classification (distance from neutral 0)
    const confidence = Math.min(100, Math.round(Math.abs(totalScore)));
    const isFake = totalScore < 0;

    // Suggestions
    if (!isFake && confidence >= 40) {
      suggestions.push('Report appears legitimate');
      suggestions.push('Consider assigning to appropriate contractor');
    } else if (confidence < 40) {
      suggestions.push('Review report details carefully');
      suggestions.push('Consider requesting additional information');
    } else {
      suggestions.push('High probability of fake report');
      suggestions.push('Consider rejecting or flagging for review');
    }

    return { isFake, confidence, reasons, suggestions };
  };

  const handleAutoAnalysis = async () => {
    if (!report) return;

    setIsAnalyzing(true);
    
    // Add bot message
    const botMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content: `Analyzing report: "${report.title}"...`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const analysis = analyzeReport(report);
    
    const analysisMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: `Analysis complete! Here's what I found:`,
      timestamp: new Date(),
      analysis
    };

    setMessages(prev => [...prev, analysisMessage]);
    setIsAnalyzing(false);
    
    if (onAnalysisComplete) {
      onAnalysisComplete(analysis);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isAnalyzing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Intent handling: weights adjustment, re-analysis, Q&A
    const lower = input.toLowerCase();
    const intentsHandled = await handleIntents(lower);
    if (!intentsHandled) {
      // General response
      setIsAnalyzing(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: getBotResponse(input),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsAnalyzing(false);
    }
  };

  const handleIntents = async (lower: string) => {
    // Adjust media weight
    if (lower.includes('prioritize images') || lower.includes('increase image weight')) {
      setWeights(w => ({ ...w, imageBoostPerImage: Math.min(20, w.imageBoostPerImage + 2), imageMaxBoost: Math.min(50, w.imageMaxBoost + 5) }));
      await pushBot(`Okay, I will weigh images more heavily in my analysis.`);
      await maybeRecalculate();
      return true;
    }
    if (lower.includes('decrease image weight')) {
      setWeights(w => ({ ...w, imageBoostPerImage: Math.max(2, w.imageBoostPerImage - 2), imageMaxBoost: Math.max(15, w.imageMaxBoost - 5) }));
      await pushBot(`Understood, reducing image influence.`);
      await maybeRecalculate();
      return true;
    }
    if (lower.includes('prioritize text') || lower.includes('increase description weight')) {
      setWeights(w => ({ ...w, detailedDescBoost: Math.min(30, w.detailedDescBoost + 5), shortDescPenalty: Math.min(40, w.shortDescPenalty + 3) }));
      await pushBot(`Got it, I will emphasize textual detail more.`);
      await maybeRecalculate();
      return true;
    }
    if (lower.includes('recalculate') || lower.includes('reanalyze') || lower.includes('re-analyze')) {
      await pushBot(`Re-analyzing with current settings...`);
      await maybeRecalculate();
      return true;
    }
    if (lower.includes('confidence') && report) {
      const a = analyzeReport(report);
      await pushBot(`Current confidence is ${a.confidence}%. I consider a report ${a.isFake ? 'likely fake' : 'likely real'}.`);
      return true;
    }
    if ((lower.includes('why') && (lower.includes('fake') || lower.includes('real'))) && report) {
      const a = analyzeReport(report);
      const top = a.reasons.slice(0, 4).join('; ');
      await pushBot(`Top reasons: ${top || 'No strong indicators either way.'}`);
      return true;
    }
    if (lower.includes('help')) {
      await pushBot('You can say: "prioritize images", "prioritize text", "recalculate", "what is the confidence", or "why fake/real".');
      return true;
    }
    return false;
  };

  const maybeRecalculate = async () => {
    if (!report) return;
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 400));
    const analysis = analyzeReport(report);
    setMessages(prev => [...prev, { id: (Date.now() + 2).toString(), type: 'bot', content: `Updated analysis ready.`, timestamp: new Date(), analysis }]);
    setIsAnalyzing(false);
    if (onAnalysisComplete) onAnalysisComplete(analysis);
  };

  const pushBot = async (content: string) => {
    setMessages(prev => [...prev, { id: (Date.now() + Math.random()).toString(), type: 'bot', content, timestamp: new Date() }]);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('fake') || input.includes('spam')) {
      return "I can help analyze reports for authenticity. I look for patterns like suspicious keywords, poor grammar, missing details, and unusual timing patterns.";
    } else if (input.includes('help') || input.includes('how')) {
      return "I analyze reports using multiple criteria: content quality, location validity, timing patterns, media presence, and language patterns. I'll flag reports that seem suspicious.";
    } else if (input.includes('confidence') || input.includes('score')) {
      return "My confidence score ranges from 0-100. Scores above 30 indicate likely fake reports. I consider factors like content quality, location details, and submission patterns.";
    } else {
      return "I'm here to help analyze reports for authenticity. Ask me about fake report detection, confidence scores, or how I evaluate reports.";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence < 30) return 'bg-green-100 text-green-800';
    if (confidence < 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence < 30) return <CheckCircle className="w-4 h-4" />;
    if (confidence < 60) return <AlertTriangle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Report Analysis AI</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.analysis && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {getConfidenceIcon(message.analysis.confidence)}
                    <Badge className={getConfidenceColor(message.analysis.confidence)}>
                      {message.analysis.isFake ? 'Likely Fake' : 'Likely Real'} 
                      ({message.analysis.confidence}% confidence)
                    </Badge>
                  </div>
                  
                  {message.analysis.reasons.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">Analysis:</p>
                      <ul className="text-xs space-y-1">
                        {message.analysis.reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-muted-foreground">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {message.analysis.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">Suggestions:</p>
                      <ul className="text-xs space-y-1">
                        {message.analysis.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-primary">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about report analysis..."
            className="flex-1 px-3 py-2 border rounded-md bg-background"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isAnalyzing}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || isAnalyzing}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ReportAnalysisChatbot;
