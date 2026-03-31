import { getAISettings, listAISettings } from '@/lib/settings'
import { addModelAction, activateModelAction, deleteModelAction } from '@/actions/settingsActions'

export const metadata = { title: 'AI Model Registry – HireOS Admin' }

export default async function AISettingsPage() {
  const { data: activeSetting } = await getAISettings()
  const { data: registry = [] } = await listAISettings()

  return (
    <div className="px-8 py-8 md:max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Model Registry</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage your AI model configurations and credentials in one place.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
          <span className="text-sm font-semibold text-indigo-700">Active Model:</span>
          <span className="text-sm font-bold text-indigo-900">
            {activeSetting ? `${activeSetting.provider} (${activeSetting.model_name})` : 'None Selected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registry Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-900">Provider</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Model</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {registry.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                      No models configured. Add your first one below.
                    </td>
                  </tr>
                ) : (
                  registry.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 capitalize font-medium text-gray-900">
                          {item.provider === 'openai' && '🤖'}
                          {item.provider === 'claude' && '🧠'}
                          {item.provider === 'gemini' && '✨'}
                          {item.provider === 'ollama' && '🦙'}
                          {item.provider}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600 font-mono text-xs">{item.model_name}</div>
                        {item.provider === 'ollama' && item.base_url && (
                          <div className="text-[10px] text-gray-400 mt-1">{item.base_url}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!item.is_active && (
                            <form action={activateModelAction.bind(null, item.id)}>
                              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                                Activate
                              </button>
                            </form>
                          )}
                          <form action={deleteModelAction.bind(null, item.id)}>
                            <button className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors">
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl bg-gray-900 p-6 text-white shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Registry Logic</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">1.</span>
                Only one model can be **Active** at a time for candidate screening.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">2.</span>
                If the active model fails, the system automatically falls back to **OpenAI (GPT-4o-mini)** using your environment keys.
              </li>
            </ul>
          </div>
        </div>

        {/* Add Model Form */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sticky top-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>➕</span> Add New Model
            </h2>

            <form action={addModelAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Provider</label>
                <select
                  name="provider"
                  required
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                >
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="claude">Anthropic (Claude)</option>
                  <option value="gemini">Google (Gemini)</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Model Name</label>
                <input
                  type="text"
                  name="model_name"
                  placeholder="e.g. gpt-4o, llama3, mistral"
                  required
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">API Key (Optional)</label>
                <input
                  type="password"
                  name="api_key"
                  placeholder="Overrides .env variable"
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                />
                <p className="mt-2 text-[10px] text-gray-400">
                  Leave blank for Ollama or to use environment keys.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Base URL (For Ollama)</label>
                <input
                  type="text"
                  name="base_url"
                  placeholder="http://localhost:11434"
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
              >
                Register Model
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
