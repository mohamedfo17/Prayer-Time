'use client'
import {  RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const RandomAyah = () => {
  const [ayah, setAyah] = useState({ arabic: '', english: '' });
  const [surahInfo, setSurahInfo] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRandomAyah = async () => {
    try {
      setLoading(true);

      const randomAyahNumber = Math.floor(Math.random() * 6236) + 1;

      const [arabicResponse, englishResponse] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/ar.alafasy`),
        fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/en.asad`)
      ]);

      const arabicData = await arabicResponse.json();
      const englishData = await englishResponse.json();

      if (arabicData.status === "OK" && englishData.status === "OK") {
        setAyah({
          arabic: arabicData.data.text,
          english: englishData.data.text
        });
        setSurahInfo(`Surah ${arabicData.data.surah.englishName} (${arabicData.data.surah.name}) • Ayah ${arabicData.data.numberInSurah}`);
      }
    } catch (error) {
      console.error('Error fetching ayah:', error);
      setAyah({
        arabic: "فَإِذَا قَرَأْتَ الْقُرْآنَ فَاسْتَعِذْ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
        english: "And when you recite the Quran, seek refuge in Allah from Satan, the expelled."
      });
      setSurahInfo("Surah An-Nahl • Ayah 98");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRandomAyah();
  }, []);

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-lg text-white hover:scale-102">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <span className="text-sm">۞</span>
        </div>
        <h2 className="text-xl font-bold">Daily Inspiration</h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-6 bg-white/20 rounded animate-pulse"></div>
          <div className="h-4 bg-white/20 rounded animate-pulse"></div>
          <div className="h-4 bg-white/20 rounded animate-pulse w-3/4"></div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-2xl leading-loose text-right font-arabic relative "dir="rtl">
              {ayah.arabic}
            </p>
          </div>

          <div className="mb-4">
            <p className="text-lg leading-relaxed text-white/90 italic">
              "{ayah.english}"
            </p>
          </div>

          <p className="text-sm text-white/70 text-right mb-4">
            {surahInfo}
          </p>

          <div className="flex justify-end">
            <button
              onClick={fetchRandomAyah}
              className="bg-white/20 hover:bg-white/30 text-white  py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
            >
                <RefreshCw className="w-4 h-4 " />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RandomAyah;