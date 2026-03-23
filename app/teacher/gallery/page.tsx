'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { 
    FiImage, FiCalendar, FiMaximize2, 
    FiX, FiDownload, FiChevronLeft, FiChevronRight,
    FiInfo, FiArrowLeft
} from 'react-icons/fi'

interface GalleryItem {
    id: string
    album_title: string
    image_urls: string[]
    category: string
    event_date: string
    description: string
}

interface SchoolSettings {
    school_name: string
    academic_start_year: number
    academic_end_year: number
}

export default function StudentGalleryPage() {
    const [albums, setAlbums] = useState<GalleryItem[]>([])
    const [schoolInfo, setSchoolInfo] = useState<SchoolSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('All')
    
    // Lightbox State
    const [activeAlbum, setActiveAlbum] = useState<GalleryItem | null>(null)
    const [photoIndex, setPhotoIndex] = useState(0)
    
    const touchStartX = useRef<number | null>(null)
    const categories = ['All', 'Events', 'Sports', 'Academic', 'Campus']

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true)
            await Promise.all([fetchGallery(), fetchSchoolSettings()])
            setLoading(false)
        }
        loadInitialData()
    }, [])

    async function fetchSchoolSettings() {
        const { data } = await supabase.from('school_settings').select('*').eq('id', 1).single()
        if (data) setSchoolInfo(data)
    }

    async function fetchGallery() {
        const { data, error } = await supabase.from('gallery').select('*').order('event_date', { ascending: false })
        if (!error) setAlbums(data || [])
    }

    const nextPhoto = useCallback(() => {
        if (!activeAlbum) return
        setPhotoIndex((prev) => (prev + 1) % activeAlbum.image_urls.length)
    }, [activeAlbum])

    const prevPhoto = useCallback(() => {
        if (!activeAlbum) return
        setPhotoIndex((prev) => (prev - 1 + activeAlbum.image_urls.length) % activeAlbum.image_urls.length)
    }, [activeAlbum])

    // Swipe Support
    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartX.current) return
        const touchEndX = e.changedTouches[0].clientX
        const diff = touchStartX.current - touchEndX
        if (Math.abs(diff) > 50) diff > 0 ? nextPhoto() : prevPhoto()
        touchStartX.current = null
    }

    const handleDownload = async (url: string) => {
        const response = await fetch(url)
        const blob = await response.blob()
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = `school-memory-${Date.now()}.jpg`
        link.click()
    }

    const filteredAlbums = selectedCategory === 'All' 
        ? albums 
        : albums.filter(a => a.category === selectedCategory)

    return (
        <div className=" bg-gray-50 dark:bg-slate-950 pb-10 transition-colors duration-300">
            
            {/* --- HEADER --- */}
            <header className="bg-white dark:bg-slate-900 border-b border-brand-soft sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 self-start md:self-auto">
                            <div className="bg-brand-soft p-2.5 rounded-2xl text-brand">
                                <FiImage size={24} />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                                    {schoolInfo?.school_name || 'Gallery'}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <span className="bg-brand/10 text-brand text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                        Session {schoolInfo?.academic_start_year}-{schoolInfo?.academic_end_year}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Category Toggle (Mobile Dropdown / Desktop Pills) */}
                        <div className="w-full md:w-auto">
                            <select 
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="md:hidden w-full bg-brand-accent/50 border border-brand-soft rounded-xl px-4 py-3 text-sm font-bold text-brand uppercase outline-none focus:ring-2 focus:ring-brand-light"
                            >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>

                            <nav className="hidden md:flex gap-2">
                                {categories.map(cat => (
                                    <button 
                                        key={cat} 
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 
                                        ${selectedCategory === cat 
                                            ? 'bg-brand border-brand text-white shadow-lg' 
                                            : 'bg-white dark:bg-slate-800 border-brand-soft text-brand-light hover:bg-brand-accent'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- GRID (2 in one row on mobile) --- */}
            <main className="max-w-7xl mx-auto px-3 md:px-6 mt-6 md:mt-10">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="aspect-[4/5] bg-brand-soft/20 animate-pulse rounded-3xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
                        {filteredAlbums.map((album) => (
                            <div 
                                key={album.id} 
                                className="group bg-white dark:bg-slate-900 rounded-[1.8rem] md:rounded-[2.5rem] border border-brand-soft overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div 
                                    className="relative aspect-square md:aspect-[4/5] m-1.5 md:m-3 rounded-[1.3rem] md:rounded-[2rem] overflow-hidden cursor-pointer"
                                    onClick={() => { setActiveAlbum(album); setPhotoIndex(0); }}
                                >
                                    <img 
                                        src={album.image_urls[0]} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                        alt={album.album_title}
                                    />
                                    <div className="absolute inset-0 bg-brand-dark/10 group-hover:bg-brand-dark/30 transition-colors flex items-center justify-center">
                                        <FiMaximize2 className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all" size={30} />
                                    </div>
                                    <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[8px] font-black text-brand uppercase shadow-sm">
                                        {album.image_urls.length} Photos
                                    </div>
                                </div>
                                <div className="px-4 pb-5 md:px-6 md:pb-8">
                                    <h3 className="text-xs md:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight line-clamp-1">
                                        {album.album_title}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-2 opacity-60">
                                        <FiCalendar size={10} className="text-brand-light" />
                                        <span className="text-[9px] font-bold uppercase tracking-tighter">
                                            {new Date(album.event_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* --- LIGHTBOX SLIDER --- */}
            {activeAlbum && (
                <div 
                    className="fixed inset-0 z-[100] bg-brand-dark/95 backdrop-blur-xl flex flex-col items-center justify-center p-2 md:p-6 select-none touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Top UI */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white z-50">
                        <div className="flex flex-col">
                            <h2 className="font-black uppercase tracking-tight text-xs md:text-lg truncate max-w-[200px]">{activeAlbum.album_title}</h2>
                            <p className="text-brand-soft text-[10px] font-black uppercase tracking-widest">
                                {photoIndex + 1} / {activeAlbum.image_urls.length}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleDownload(activeAlbum.image_urls[photoIndex])} className="p-3 bg-white/10 hover:bg-brand-light rounded-2xl transition-all">
                                <FiDownload size={20}/>
                            </button>
                            <button onClick={() => setActiveAlbum(null)} className="p-3 bg-brand-light hover:bg-rose-500 rounded-2xl transition-all shadow-xl">
                                <FiX size={20}/>
                            </button>
                        </div>
                    </div>

                    {/* Main Photo */}
                    <div className="relative w-full h-[65vh] md:h-[75vh] flex items-center justify-center">
                        <button onClick={prevPhoto} className="hidden md:flex absolute -left-16 items-center justify-center w-14 h-14 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all">
                            <FiChevronLeft size={48} />
                        </button>
                        
                        <img 
                            key={photoIndex}
                            src={activeAlbum.image_urls[photoIndex]} 
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-500"
                            alt="View"
                        />

                        <button onClick={nextPhoto} className="hidden md:flex absolute -right-16 items-center justify-center w-14 h-14 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all">
                            <FiChevronRight size={48} />
                        </button>
                    </div>

                    {/* Navigation Buttons for Mobile */}
                    <div className="flex md:hidden w-full justify-between px-10 mt-4 text-white">
                         <button onClick={prevPhoto} className="p-4 bg-white/10 rounded-full"><FiChevronLeft size={30}/></button>
                         <button onClick={nextPhoto} className="p-4 bg-white/10 rounded-full"><FiChevronRight size={30}/></button>
                    </div>

                    {/* Bottom Thumbnails */}
                    <div className="w-full flex gap-3 overflow-x-auto py-6 px-4 no-scrollbar justify-start md:justify-center mt-auto">
                        {activeAlbum.image_urls.map((url, i) => (
                            <button 
                                key={i} 
                                onClick={() => setPhotoIndex(i)}
                                className={`relative w-14 h-14 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-300 
                                ${photoIndex === i ? 'border-brand-light scale-110 shadow-lg shadow-brand/40' : 'border-transparent opacity-30'}`}
                            >
                                <img src={url} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}