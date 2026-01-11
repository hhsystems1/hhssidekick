/**
 * Agent Test Component
 * In-browser testing for the agent system with Groq API
 *
 * Add this to your app to test agents in the browser
 */

import React, { useState } from 'react';
import { processWithAgents } from '../agents/index';
import type { AgentRequest } from '../types/agents';

export const AgentTestPanel: React.FC = () => {
  const [testMessage, setTestMessage] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testMessages = [
    "I'm thinking about switching careers. Should I stay in corporate or start my own business?",
    "How should I price my consulting services?",
    "I need to automate my client onboarding process.",
    "What's the best architecture for a multi-tenant SaaS?",
    "Help me write a compelling landing page headline for a time-tracking app."
  ];

  const testAgent = async (message: string) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const request: AgentRequest = {
        messageContent: message,
        userContext: {
          userId: 'test-user',
          currentProject: 'Test',
          recentTopics: [],
        },
        conversationId: 'test-conversation',
        messageHistory: [],
      };

      const startTime = Date.now();
      const result = await processWithAgents(request);
      const duration = Date.now() - startTime;

      setResponse({
        ...result,
        duration,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">🧪 Agent System Test</h2>

        {/* Quick Test Buttons */}
        <div className="space-y-2 mb-6">
          <p className="text-sm text-slate-400 mb-3">Quick Tests:</p>
          {testMessages.map((msg, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTestMessage(msg);
                testAgent(msg);
              }}
              className="w-full text-left p-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 hover:border-emerald-500 transition-colors text-sm"
            >
              {msg}
            </button>
          ))}
        </div>

        {/* Custom Message */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">
            Or test with your own message:
          </label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter a test message..."
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
          />
          <button
            onClick={() => testAgent(testMessage)}
            disabled={!testMessage.trim() || loading}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Testing...' : 'Test Agent'}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-6 p-4 bg-blue-950/30 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300">⏳ Calling Groq API and processing with agent...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-6 p-4 bg-red-950/30 border border-red-500/30 rounded-lg">
            <p className="text-red-300 font-semibold">❌ Error:</p>
            <p className="text-red-200 text-sm mt-2">{error}</p>
            <div className="mt-4 text-xs text-red-400">
              <p className="font-semibold mb-2">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check that VITE_GROQ_API_KEY is set in Netlify environment variables</li>
                <li>Verify the API key is correct and active</li>
                <li>Check browser console for more details</li>
                <li>Ensure you're not rate limited</li>
              </ul>
            </div>
          </div>
        )}

        {/* Success State */}
        {response && !error && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-lg">
              <p className="text-emerald-300 font-semibold mb-2">✅ Success!</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Agent:</p>
                  <p className="text-emerald-200 font-semibold">{response.agentType}</p>
                </div>
                <div>
                  <p className="text-slate-400">Mode:</p>
                  <p className="text-emerald-200 font-semibold">{response.behavioralMode}</p>
                </div>
                <div>
                  <p className="text-slate-400">Response Time:</p>
                  <p className="text-emerald-200 font-semibold">{response.duration}ms</p>
                </div>
                <div>
                  <p className="text-slate-400">Tokens:</p>
                  <p className="text-emerald-200 font-semibold">{response.metadata.tokensUsed || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm mb-2">Response:</p>
              <p className="text-slate-100 whitespace-pre-wrap">{response.content}</p>
            </div>

            {response.routingReason && (
              <div className="p-3 bg-slate-950 border border-slate-700 rounded-lg">
                <p className="text-slate-400 text-xs mb-1">Routing Reason:</p>
                <p className="text-slate-300 text-sm">{response.routingReason}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
