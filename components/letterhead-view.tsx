"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Printer, Eye, PenLine, ChevronLeft } from "lucide-react"

interface LetterHeadViewProps {
    onBack?: () => void
}

const MAX_LINES_PER_PAGE = 27

export default function LetterHeadView({ onBack }: LetterHeadViewProps) {
    const [isEditing, setIsEditing] = useState(true)
    const [fullContent, setFullContent] = useState<string>(`# Project Proposal

**Date:** ${new Date().toLocaleDateString()}

**To:** Client Name

**Subject:** Proposal for Software Development Services

Dear Sir/Madam,

On behalf of **Talentronaut Technologies**, we are pleased to submit this proposal for your review. We are committed to delivering high-quality solutions that meet your business objectives.

### Scope of Work
1. Requirement Analysis & Planning
2. UI/UX Design & Prototyping
3. Core Development (Frontend & Backend)
4. Quality Assurance & Testing
5. Deployment & Maintenance

We look forward to the opportunity to work together.

Best Regards,
**Talentronaut Team**
`)

    // Derived state: Pages of lines
    const [pages, setPages] = useState<string[][]>([])

    // Company details
    const companyDetails = {
        name: "Talentronaut Technologies Pvt. Ltd",
        address: "5-49, Maharaja Garden, Bajanai Kovil St, Andavar Nagar, Ramapuram, Chennai, Tamil Nadu 600089",
        contact: "+91 8220324802 |support@talentronaut.in",
        cin: "U85499MH2024PTC421338",
        gstin: "27AAKCT8463F1ZW",
        msme: "UDYAM-MH-04-0177043"
    }

    const handlePrint = () => {
        setIsEditing(false)
        setTimeout(() => {
            window.print()
        }, 300)
    }

    // PAGINATION LOGIC (Runs on content change)
    useEffect(() => {
        const CHARS_PER_LINE = 75 // Approx chars for A4 width
        const MAX_VISUAL_LINES = MAX_LINES_PER_PAGE

        const pagesArray: string[][] = []
        let currentPageLines: string[] = []
        let currentVisualLinesCount = 0

        const rawLines = fullContent.split('\n')

        for (let i = 0; i < rawLines.length; i++) {
            const line = rawLines[i]

            // Calculate visual lines for this paragraph
            // Empty line counts as 1
            const visualCost = Math.max(1, Math.ceil(line.length / CHARS_PER_LINE))

            // If it fits entirely in current page
            if (currentVisualLinesCount + visualCost <= MAX_VISUAL_LINES) {
                currentPageLines.push(line)
                currentVisualLinesCount += visualCost
            }
            else {
                // IT DOES NOT FIT ENTIRLY. 
                // Decision: Move completely or Split? 

                // If it's a huge paragraph (visualCost > MAX_VISUAL_LINES), we MUST split it.
                // If the remaining space is small, we move the whole paragraph to next page (cleaner).
                // BUT user wants "line wise... not whole para". So we try to fill the current page first.

                const remainingLinesSpace = MAX_VISUAL_LINES - currentVisualLinesCount

                if (remainingLinesSpace > 0 && line.length > CHARS_PER_LINE) {
                    // Try to cut a chunk that fits the remaining space
                    const charsThatFit = remainingLinesSpace * CHARS_PER_LINE

                    // Find a space near the cutoff to avoid breaking words
                    let cutIndex = line.lastIndexOf(' ', charsThatFit)
                    // If no space found near cutoff (e.g. very long word), just hard cut
                    if (cutIndex === -1 || cutIndex < charsThatFit * 0.7) cutIndex = charsThatFit

                    const firstPart = line.substring(0, cutIndex)
                    const restPart = line.substring(cutIndex + 1) // +1 to skip space

                    currentPageLines.push(firstPart)
                    pagesArray.push(currentPageLines)

                    // Reset for next page
                    currentPageLines = []
                    currentVisualLinesCount = 0

                    // Now handle the rest. The rest might STILL be huge.
                    // We treat 'restPart' as the new line to process.
                    // Since we are inside a loop iterating `rawLines`, we need to handle this manually.
                    // Simplest recursive-like way:

                    let remainingText = restPart
                    while (true) {
                        const remainingVisualCost = Math.ceil(remainingText.length / CHARS_PER_LINE)

                        if (currentVisualLinesCount + remainingVisualCost <= MAX_VISUAL_LINES) {
                            currentPageLines.push(remainingText)
                            currentVisualLinesCount += remainingVisualCost
                            break;
                        } else {
                            // Still too big for a fresh page
                            const pageChars = MAX_VISUAL_LINES * CHARS_PER_LINE
                            let cut = remainingText.lastIndexOf(' ', pageChars)
                            if (cut === -1 || cut < pageChars * 0.7) cut = pageChars

                            pagesArray.push([remainingText.substring(0, cut)])
                            remainingText = remainingText.substring(cut + 1)
                            currentVisualLinesCount = 0
                        }
                    }
                } else {
                    // Just overflow to new page if it fits there nicely
                    // OR if we have 0 remaining lines (full page), push and reset
                    pagesArray.push(currentPageLines)
                    currentPageLines = []
                    currentVisualLinesCount = 0

                    // Handle the line for the new page
                    // But wait, what if the line is HUGE and > MAX_VISUAL_LINES itself?
                    if (visualCost > MAX_VISUAL_LINES) {
                        let remainingText = line
                        while (remainingText.length > 0) {
                            const pageChars = MAX_VISUAL_LINES * CHARS_PER_LINE
                            if (remainingText.length <= pageChars) {
                                currentPageLines.push(remainingText)
                                currentVisualLinesCount = Math.ceil(remainingText.length / CHARS_PER_LINE)
                                remainingText = ""
                            } else {
                                let cut = remainingText.lastIndexOf(' ', pageChars)
                                if (cut === -1) cut = pageChars
                                pagesArray.push([remainingText.substring(0, cut)])
                                remainingText = remainingText.substring(cut + 1)
                            }
                        }
                    } else {
                        currentPageLines.push(line)
                        currentVisualLinesCount = visualCost
                    }
                }
            }
        }

        // Push last page
        if (currentPageLines.length > 0 || pagesArray.length === 0) {
            pagesArray.push(currentPageLines)
        }

        setPages(pagesArray)
    }, [fullContent])





    // Simple Markdown Renderer
    const renderMarkdownLine = (line: string, index: number) => {
        if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-gray-800">{line.replace('### ', '')}</h3>
        if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-gray-900 border-b pb-1">{line.replace('## ', '')}</h2>
        if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-bold mt-6 mb-4 text-[#D4503A]">{line.replace('# ', '')}</h1>
        if (line.trim().match(/^\d+\./)) return <div key={index} className="ml-4 mb-1 pl-2 border-l-2 border-gray-200">{line}</div>
        if (line.trim().startsWith('- ')) return <li key={index} className="ml-5 mb-1">{line.replace('- ', '')}</li>

        const parts = line.split(/(\*\*.*?\*\*)/);
        const bolded = parts.map((part, i) =>
            part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
        )
        if (line.trim() === '') return <div key={index} className="h-4" /> // Explicit height for breaks
        return <p key={index} className="mb-2 leading-relaxed">{bolded}</p>
    }

    return (
        <div className="p-8 h-full flex flex-col gap-6 bg-[#f0f2f5] letterhead-container">
            {/* Action Bar */}
            <div className="flex justify-between items-center no-print max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-white/50">
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </Button>
                    )}
                    <div>
                        <h2 className="text-3xl font-bold font-brand text-gray-800">Letterhead</h2>
                        <p className="text-muted-foreground">Create official documents with ease</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        className="hover:bg-white/50"
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? <><Eye className="w-4 h-4 mr-2" /> Preview Mode</> : <><PenLine className="w-4 h-4 mr-2" /> Edit Mode</>}
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" /> Print / Save as PDF
                    </Button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className={`flex-1 overflow-y-auto no-scroll-print flex justify-center pb-20 print:pb-0 print-content`}>
                <div className="flex flex-col gap-8 print:gap-0">

                    {isEditing ? (
                        /* EDIT MODE: Single Continuous Page */
                        <div className="a4-page bg-white shadow-2xl relative print:shadow-none transition-all duration-300 min-h-[297mm] flex flex-col justify-between group">

                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                <div className="w-[450px] h-[450px] flex items-center justify-center opacity-[0.04] mix-blend-multiply">
                                    <img src="/logo.svg" alt="" className="w-full grayscale contrast-125" />
                                </div>
                            </div>

                            {/* Content Layer */}
                            <div className="relative z-10 flex flex-col min-h-[297mm]">
                                <LetterheadHeader companyDetails={companyDetails} />

                                <div className="flex-1 px-16 py-4 relative flex flex-col">
                                    <textarea
                                        value={fullContent}
                                        onChange={(e) => setFullContent(e.target.value)}
                                        className="w-full flex-1 resize-none outline-none border-none bg-transparent font-serif text-gray-800 text-lg leading-loose placeholder:text-gray-300 selection:bg-[#D4503A]/20 min-h-[500px]"
                                        placeholder="Start typing your letter content here..."
                                        spellCheck={false}
                                    />
                                </div>

                                <LetterheadFooter pageNum={1} />
                            </div>
                        </div>
                    ) : (
                        /* PREVIEW MODE: Paginated Pages */
                        <>
                            {pages.map((pageLines, pageIndex) => (
                                <div key={pageIndex} className="a4-page bg-white shadow-2xl relative print:shadow-none transition-all duration-300 h-[297mm] flex flex-col justify-between group">

                                    {/* Watermark */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                        <div className="w-[450px] h-[450px] flex items-center justify-center opacity-[0.04] mix-blend-multiply">
                                            <img src="/logo.svg" alt="" className="w-full grayscale contrast-125" />
                                        </div>
                                    </div>

                                    {/* Content Layer */}
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <LetterheadHeader companyDetails={companyDetails} />

                                        <div className="flex-1 px-16 py-4 relative">
                                            <div className="overflow-hidden">
                                                {pageLines.map((line, i) => renderMarkdownLine(line, i))}
                                            </div>
                                        </div>

                                        <LetterheadFooter pageNum={pageIndex + 1} />
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                </div>
            </div>

            <style jsx global>{`
        .a4-page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: white;
          break-after: page;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html, body {
            width: 210mm;
            height: auto !important;
            min-height: 100%;
            margin: 0;
            padding: 0;
            overflow: visible !important;
          }
          
          body {
             visibility: hidden;
          }
          
          /* Reset the flex container that holds the pages */
          .print-content {
             display: block !important; /* Disable flex */
             height: auto !important;
             overflow: visible !important;
             position: static !important;
          }

          /* Ensure the container behaves */
          .letterhead-container {
             visibility: visible;
             position: absolute;
             top: 0;
             left: 0;
             width: 210mm;
             height: auto !important;
             margin: 0;
             padding: 0;
             background: white;
             overflow: visible !important;
             display: block !important;
          }

          .letterhead-container * {
            visibility: visible;
          }
          
          .no-print {
            display: none !important;
          }
          
          /* Remove shadows and gaps */
          .a4-page {
             box-shadow: none !important;
             margin: 0 !important;
             width: 210mm !important;
             height: 296mm !important; /* Keep page height fixed per page */
             page-break-after: always;
             break-after: page;
             overflow: hidden;
             print-color-adjust: exact;
             -webkit-print-color-adjust: exact;
             position: relative;
          }
          
          /* Fix for last page empty sheet */
          .a4-page:last-child {
             page-break-after: auto;
             break-after: auto;
             height: 296mm !important; /* Force standard height so footer stays at bottom */
             min-height: 296mm;
          }
        }
      `}</style>
        </div>
    )
}

// Subcomponents for clearer structure
function LetterheadHeader({ companyDetails }: { companyDetails: any }) {
    return (
        <div className="w-full bg-white pb-6 pt-10 px-16 border-b border-gray-100">
            <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                    <h1 className="text-5xl font-black text-[#D4503A] tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Talentronaut
                    </h1>
                    <p className="text-[11px] text-gray-400 font-bold tracking-[0.3em] uppercase mt-2 ml-1">Workspace</p>
                </div>
                <div className="text-right space-y-2">
                    <p className="font-bold text-gray-900 text-base">{companyDetails.name}</p>
                    <p className="text-sm text-gray-500 font-medium">{companyDetails.address}</p>
                    <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
                        <span>{companyDetails.contact}</span>
                    </div>
                </div>
            </div>

            <div className="w-full bg-gray-50 border-y border-gray-100 px-4 py-3 flex justify-between items-center text-[9px] text-gray-500 uppercase tracking-widest font-semibold rounded-sm">
                <span>CIN: {companyDetails.cin}</span>
                <span>GSTIN: {companyDetails.gstin}</span>
                <span>MSME: {companyDetails.msme}</span>
            </div>
        </div>
    )
}

function LetterheadFooter({ pageNum }: { pageNum: number }) {
    return (
        <div className="w-full bg-white px-16 pb-12 pt-4 mt-auto">
            <div className="border-t-2 border-[#D4503A] pt-8 flex flex-col items-center gap-6">
                <div className="flex gap-10 text-xs font-bold text-gray-400 tracking-widest uppercase">
                    <a href="https://www.linkedin.com/company/talentronaut-technologies-private-limited/posts/?feedView=all" className="hover:text-[#D4503A] transition-colors duration-300">LinkedIn</a>
                    <a href="https://www.instagram.com/talentronaut/" className="hover:text-[#D4503A] transition-colors duration-300">Instagram</a>

                </div>
                <div className="flex w-full justify-between items-end text-[10px] text-gray-400 font-medium">
                    <div className="w-1/3 text-left">
                        &copy; {new Date().getFullYear()} Talentronaut. All rights reserved.
                    </div>
                    <div className="w-1/3 text-center">
                        <a href="https://www.talentronaut.in/" className="text-gray-600 hover:text-[#D4503A] transition-colors font-bold text-xs">
                            www.talentronaut.in
                        </a>
                    </div>
                    <div className="w-1/3 text-right">
                        Page {pageNum}
                    </div>
                </div>
            </div>
        </div>
    )
}
