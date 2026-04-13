'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { 
    FiImage, FiCalendar, FiMaximize2, 
    FiX, FiDownload, FiChevronLeft, FiChevronRight
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
        <div className="w-full min-h-screen transition-colors duration-300">
            
            {/* --- TOP BANNER/HEADER --- */}
            <div className="mb-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-brand/10 rounded-lg text-brand">
                                <FiImage size={18} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Memory Lane</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            School <span className="text-brand">Gallery</span>
                        </h1>
                    </div>

                     {/* Category Tabs: Centered on mobile, Right on Desktop */}
                 <div className="flex flex-wrap gap-2 justify-center md:justify-center">
    {categories.map(cat => (
        <button 
            key={cat} 
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all
            ${selectedCategory === cat 
                ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'}`}
        >
            {cat}
        </button>
    ))}
</div>
                </div>
            </div>

            {/* --- ALBUM GRID --- */}
            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-[4/5] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filteredAlbums.map((album) => (
                        <div 
                            key={album.id} 
                            onClick={() => { setActiveAlbum(album); setPhotoIndex(0); }}
                            className="group relative aspect-[4/5] bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
                        >
                            <img 
                                src={album.image_urls[0]} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                alt={album.album_title}
                            />
                            
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            
                            {/* Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <span className="text-[8px] font-black text-brand-soft uppercase tracking-widest bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full">
                                    {album.category}
                                </span>
                                <h3 className="text-white text-xs md:text-sm font-bold uppercase mt-1 line-clamp-1">
                                    {album.album_title}
                                </h3>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-1 text-white/50 text-[8px] font-bold">
                                        <FiCalendar size={10} />
                                        {new Date(album.event_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="bg-white text-black px-2 py-0.5 rounded-full text-[8px] font-black">
                                        {album.image_urls.length} PICS
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- NATIVE LIGHTBOX --- */}
            {activeAlbum && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col select-none animate-in fade-in duration-300"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 md:p-8">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setActiveAlbum(null)}
                                className="p-3 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all"
                            >
                                <FiX size={20} />
                            </button>
                            <div>
                                <h2 className="text-white font-black uppercase text-sm md:text-xl tracking-tight">{activeAlbum.album_title}</h2>
                                <p className="text-brand-soft text-[10px] font-bold uppercase tracking-widest">
                                    Image {photoIndex + 1} of {activeAlbum.image_urls.length}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDownload(activeAlbum.image_urls[photoIndex])}
                            className="p-3 bg-brand rounded-2xl text-white shadow-lg shadow-brand/30 active:scale-90 transition-all"
                        >
                            <FiDownload size={20} />
                        </button>
                    </div>

                    {/* Main View */}
                    <div className="flex-1 relative flex items-center justify-center p-4">
                        {/* Desktop Controls */}
                        <button onClick={prevPhoto} className="hidden md:flex absolute left-8 w-14 h-14 items-center justify-center bg-white/5 rounded-full text-white hover:bg-white/10 transition-all">
                            <FiChevronLeft size={32} />
                        </button>

                        <img 
                            key={photoIndex}
                            src={activeAlbum.image_urls[photoIndex]} 
                            className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
                            alt="Viewing"
                        />

                        <button onClick={nextPhoto} className="hidden md:flex absolute right-8 w-14 h-14 items-center justify-center bg-white/5 rounded-full text-white hover:bg-white/10 transition-all">
                            <FiChevronRight size={32} />
                        </button>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="p-6 bg-black/50 backdrop-blur-md">
                        <div className="flex gap-3 overflow-x-auto no-scrollbar justify-start md:justify-center">
                            {activeAlbum.image_urls.map((url, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setPhotoIndex(i)}
                                    className={`relative w-14 h-14 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 transition-all duration-300 border-2
                                    ${photoIndex === i ? 'border-brand scale-110 shadow-lg shadow-brand/20' : 'border-transparent opacity-40'}`}
                                >
                                    <img src={url} className="w-full h-full object-cover" alt="thumb" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}