/**
 * Database Test Component
 * In-browser testing for Supabase database operations
 */

import React, { useState } from 'react';
import * as db from '../services/database';

export const DatabaseTestPanel: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, success: boolean, data?: any, error?: string) => {
    setResults(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      test,
      success,
      data,
      error
    }]);
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      const result = await testFn();
      addResult(testName, true, result);
      return result;
    } catch (error: any) {
      addResult(testName, false, null, error.message);
      throw error;
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);

    const testUserId = '00000000-0000-0000-0000-000000000000';

    try {
      // Test 1: Create a task
      await runTest('Create Task', async () => {
        return await db.createTask(testUserId, 'Test Task from Browser', {
          priority: 'medium'
        });
      });

      // Test 2: Get tasks
      const tasks = await runTest('Get Tasks', async () => {
        return await db.getUserTasks(testUserId);
      });

      // Test 3: Toggle task if we have any
      if (tasks && tasks.length > 0) {
        await runTest('Toggle Task', async () => {
          return await db.toggleTaskCompletion(tasks[0].id, !tasks[0].completed);
        });
      }

      // Test 4: Create an agent
      await runTest('Create Agent', async () => {
        return await db.createAgent(testUserId, 'Test Agent', 'reflection');
      });

      // Test 5: Get agents
      await runTest('Get Agents', async () => {
        return await db.getUserAgents(testUserId);
      });

      // Test 6: Create a conversation
      await runTest('Create Conversation', async () => {
        return await db.createConversation(testUserId, 'Test Conversation');
      });

      // Test 7: Get conversations
      await runTest('Get Conversations', async () => {
        return await db.getUserConversations(testUserId);
      });

      addResult('All Tests Complete', true, { testsRun: 7 });
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => setResults([]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">🗄️ Database Test</h2>

        <div className="space-y-3 mb-6">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Running Tests...' : 'Run All Database Tests'}
          </button>

          {results.length > 0 && (
            <button
              onClick={clearResults}
              className="w-full py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              Clear Results
            </button>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Test Results:</h3>
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  result.success
                    ? 'bg-emerald-950/30 border-emerald-500/30'
                    : 'bg-red-950/30 border-red-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`font-semibold ${result.success ? 'text-emerald-300' : 'text-red-300'}`}>
                      {result.success ? '✅' : '❌'} {result.test}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{result.timestamp}</p>
                    {result.error && (
                      <p className="text-sm text-red-200 mt-2">{result.error}</p>
                    )}
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                          View Data
                        </summary>
                        <pre className="text-xs text-slate-300 mt-2 p-2 bg-slate-950 rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {results.length === 0 && !loading && (
          <div className="p-4 bg-slate-950 border border-slate-700 rounded-lg">
            <p className="text-slate-300 text-sm mb-3">This will test:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
              <li>Task creation and retrieval</li>
              <li>Task status toggling</li>
              <li>Agent creation and retrieval</li>
              <li>Conversation creation and retrieval</li>
              <li>Database connectivity</li>
            </ul>
            <p className="text-xs text-slate-500 mt-4">
              Note: Requires database schema to be set up in Supabase
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
