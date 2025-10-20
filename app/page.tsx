
'use client';

export default function Page() {
  return (
    <main className="min-h-screen  p-6 flex items-center justify-center relative overflow-hidden bg-bg-[#121212]e">

      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-black">
            SKATE
          </h1>
        </div>

        {/* Cards Container */}
        <div className="flex flex-col sm:flex-row gap-8 items-center justify-center">

          <a
            href="/skateboardbuild"
            className="group relative w-64 h-80 perspective-1000"
          >
            <div className="relative w-full h-full transition-all duration-500 transform group-hover:scale-105 group-hover:-rotate-2">

              <div className="relative w-full h-full bg-white border rounded-3xl p-8 flex flex-col items-center justify-center gap-6 overflow-hidden">

                <div className="relative z-10 w-20 h-20 bg-black rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>

                <div className="relative z-10 text-center space-y-2">
                  <h2 className="text-3xl font-bold text-black group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">
                    Design
                  </h2>
                  <p className="text-slate-400 text-sm">Create your custom deck</p>
                </div>


                <div className="relative z-10 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </a>

          <a
            href="/admin"
            className="group relative w-64 h-80 perspective-1000"
          >
            <div className="relative w-full h-full transition-all duration-500 transform group-hover:scale-105 group-hover:rotate-2">
              <div className="relative w-full h-full bg-black rounded-3xl p-8 flex flex-col items-center justify-center gap-6 overflow-hidden">

                <div className="relative z-10 w-20 h-20 bg-white rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                  <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>

                <div className="relative z-10 text-center space-y-2">
                  <h2 className="text-3xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-400 transition-all duration-300">
                    Admin
                  </h2>
                  <p className="text-slate-400 text-sm">Manage your boards</p>
                </div>

                {/* Hover arrow */}
                <div className="relative z-10 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </a>
        </div>

      </div>
    </main>
  );
}
