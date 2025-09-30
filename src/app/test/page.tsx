'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🚀 LatentSee Test Page</h1>
        <p className="text-xl text-green-400">✅ If you can see this, the app is working!</p>
        <div className="mt-8 space-y-4">
          <p className="text-slate-300">
            📅 {new Date().toLocaleString()}
          </p>
          <p className="text-slate-300">
            🌐 React is rendering properly
          </p>
          <p className="text-slate-300">
            🎨 Tailwind CSS is working
          </p>
        </div>
        <div className="mt-8">
          <a 
            href="/" 
            className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg transition-colors"
          >
            Go to Main Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}