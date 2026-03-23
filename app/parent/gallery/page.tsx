'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FiImage, FiCalendar, FiFilter, FiMaximize2, FiX } from 'react-icons/fi'

interface GalleryItem {
    id: string
    album_title: string
    image_urls: string[]
    category: string
    event_date: string
    description: string
}

export default function StudentGalleryPage() {
    const [albums, setAlbums] = useState<GalleryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const categories = ['All', 'Events', 'Sports', 'Academic', 'Campus']

    useEffect(() => {
        fetchGallery()
    }, [])

    async function fetchGallery() {
        setLoading(true)
        const { data, error } = await supabase
            .from('gallery')
            .select('*')
            .order('event_date', { ascending: false })

        if (error) {
            console.error('Error fetching gallery:', error)
        } else {
            setAlbums(data || [])
        }
        setLoading(false)
    }

    const filteredAlbums = selectedCategory === 'All' 
        ? albums 
        : albums.filter(album => album.category === selectedCategory)

    return (
        <div className="min-h-screen p-4 md:p-8 mt-16 md:mt-10 bg-[#FCFAFC] dark:bg-slate-950 transition-colors duration-300">
            
            {/* HEADER */}
            <header className="max-w-7xl mx-auto mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">
                            School Gallery
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">
                            Capturing Moments & Memories
                        </p>
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        <FiFilter className="text-indigo-500 shrink-0" />
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0
                                    ${selectedCategory === cat 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                                        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-indigo-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* GALLERY GRID */}
            <main className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-[2rem]"></div>
                        ))}
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {filteredAlbums.map((album) => (
                            <div 
                                key={album.id} 
                                className="break-inside-avoid bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all group"
                            >
                                {/* Thumbnail / Primary Image */}
                                <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    {album.image_urls?.[0] ? (
                                        <img 
                                            src={album.image_urls[0]} 
                                            alt={album.album_title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                                            onClick={() => setSelectedImage(album.image_urls[0])}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <FiImage size={48} />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">
                                            {album.category}
                                        </span>
                                    </div>
                                    {album.image_urls.length > 1 && (
                                        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] text-white font-bold">
                                            +{album.image_urls.length - 1} Photos
                                        </div>
                                    )}
                                </div>

                                {/* Album Details */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                                        <FiCalendar size={12} />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter">
                                            {new Date(album.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight mb-2 uppercase">
                                        {album.album_title}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                        {album.description}
                                    </p>
                                    
                                    {/* Small Preview Dots for other images in album */}
                                    <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
                                        {album.image_urls.slice(1, 5).map((url, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setSelectedImage(url)}
                                                className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 hover:ring-2 ring-indigo-500 transition-all shrink-0"
                                            >
                                                <img src={url} className="w-full h-full object-cover" alt="preview" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && filteredAlbums.length === 0 && (
                    <div className="py-20 text-center">
                        <FiImage className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
                        <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No photos found in this category</p>
                    </div>
                )}
            </main>

            {/* LIGHTBOX MODAL */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-4 backdrop-blur-sm">
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                    >
                        <FiX size={24} />
                    </button>
                    <img 
                        src={selectedImage} 
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
                        alt="Full Preview"
                    />
                </div>
            )}
        </div>
    )
}