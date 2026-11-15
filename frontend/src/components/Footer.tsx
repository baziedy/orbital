import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer data-reveal className="bg-[#101114] text-[#FFFFFF] border-t border-[#26282E] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-[#26282E]">
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 rounded-full border border-[#FFFFFF]/60 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF]" />
                </div>
                <span className="font-sans font-semibold tracking-widest text-sm text-[#FFFFFF]">ORBITAL</span>
              </div>
              <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-sm mb-6">
                Explore released SPHEREx archive records alongside clearly identified reference imagery.
              </p>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs text-[#D1D5DB]">
              <li><Link href="/" className="hover:text-[#FFFFFF] transition-colors">Discover</Link></li>
              <li><Link href="/explore" className="hover:text-[#FFFFFF] transition-colors">Sky Explorer</Link></li>
              <li><Link href="/compare" className="hover:text-[#FFFFFF] transition-colors">Compare Observations</Link></li>
              <li><Link href="/research" className="hover:text-[#FFFFFF] transition-colors">My Research</Link></li>
              <li><Link href="/about" className="hover:text-[#FFFFFF] transition-colors">Mission Architecture</Link></li>
              <li><Link href="/sources" className="hover:text-[#FFFFFF] transition-colors">Sources & Calculations</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[11px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-4">Primary Data Sources</h4>
            <ul className="space-y-2.5 text-xs text-[#D1D5DB]">
              <li>
                <a 
                  href="https://irsa.ipac.caltech.edu/Missions/spherex.html" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 hover:text-[#FFFFFF] transition-colors"
                >
                  <span>IRSA SPHEREx Archive</span>
                  <ExternalLink className="w-3 h-3 text-[#6B7280]" />
                </a>
              </li>
              <li>
                <a 
                  href="https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 hover:text-[#FFFFFF] transition-colors"
                >
                  <span>SPHEREx Data Access Guide</span>
                  <ExternalLink className="w-3 h-3 text-[#6B7280]" />
                </a>
              </li>
              <li>
                <a 
                  href="https://science.nasa.gov/mission/spherex/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 hover:text-[#FFFFFF] transition-colors"
                >
                  <span>NASA Mission Overview</span>
                  <ExternalLink className="w-3 h-3 text-[#6B7280]" />
                </a>
              </li>
              <li>
                <a 
                  href="https://fits.gsfc.nasa.gov/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 hover:text-[#FFFFFF] transition-colors"
                >
                  <span>NASA FITS Data Standards</span>
                  <ExternalLink className="w-3 h-3 text-[#6B7280]" />
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-4">Challenge Targets</h4>
            <ul className="space-y-2 text-xs text-[#9CA3AF] font-mono-sci">
              <li><Link href="/explore?target=WISE%200855-0714" className="hover:text-[#FFFFFF] transition-colors">WISE 0855</Link></li>
              <li><Link href="/explore?target=Barnard%27s%20Star" className="hover:text-[#FFFFFF] transition-colors">Barnard&apos;s Star</Link></li>
              <li><Link href="/explore?target=Epsilon%20Indi%20Ba/Bb" className="hover:text-[#FFFFFF] transition-colors">Epsilon Indi</Link></li>
              <li><Link href="/explore?target=RW%20Aurigae" className="hover:text-[#FFFFFF] transition-colors">RW Aurigae</Link></li>
              <li><Link href="/explore?target=R%20Draconis" className="hover:text-[#FFFFFF] transition-colors">R Draconis</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left text-xs text-[#6B7280] font-mono-sci gap-4">
          <div className="break-words">
            © 2026 ORBITAL · Planet X and SPHEREx
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center sm:justify-end">
            <span>NEAR-INFRARED 102-BAND EXPLORER</span>
            <span>PUBLIC ASTROPHYSICS ENGINE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
