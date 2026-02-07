"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight } from "lucide-react"

interface OthersViewProps {
    onViewChange: (view: "letterhead") => void
}

export default function OthersView({ onViewChange }: OthersViewProps) {
    return (
        <div className="p-8 h-full bg-[#FAFAFA] flex flex-col gap-8">
            <div>
                <h2 className="text-3xl font-bold font-brand text-gray-800">Other Tools</h2>
                <p className="text-muted-foreground mt-1">Access additional workspace utilities</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Letterhead Card */}
                <Card className="p-6 hover:shadow-lg transition-all duration-300 border-none shadow-md bg-white group cursor-pointer" onClick={() => onViewChange("letterhead")}>
                    <div className="h-12 w-12 rounded-xl bg-[#D4503A]/10 text-[#D4503A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <FileText className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-2">Letterhead</h3>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        Create professional documents with company branding. Write, edit, and print directly from the workspace.
                    </p>

                    <div className="flex items-center text-[#D4503A] font-semibold text-sm group-hover:translate-x-1 transition-transform duration-300">
                        Open Tool <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                </Card>

                {/* Placeholder for future tools */}
                {/* <Card className="p-6 border-dashed border-2 border-gray-200 bg-transparent flex flex-col items-center justify-center text-center gap-2 min-h-[240px]">
            <p className="text-gray-400 font-medium text-sm">More tools coming soon</p>
        </Card> */}
            </div>
        </div>
    )
}
