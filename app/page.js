'use client'
import { useState, useEffect } from 'react';
import {  MapPin, Clock, Loader2, Sunset, Sunrise, Moon, Sun, SunMedium, Coffee } from 'lucide-react';
import RandomAyah from './components/RndomAyah';

export default function PrayerTimes() {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState({ name: '', time: '', countdown: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geoLoading, setGeoLoading] = useState(true);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userTimezone, setUserTimezone] = useState('');
  const [userCountry, setUserCountry] = useState('');
  const [locationTimezone, setLocationTimezone] = useState('');

  const mosqueBackgrounds = [
    'https://upload.wikimedia.org/wikipedia/commons/f/fe/Grande_Mosqu%C3%A9e_d%27Alger.jpg',
    'https://i.pinimg.com/736x/88/e7/be/88e7be12254bc350b0ba2e65303c36b1.jpg',
    'https://i.pinimg.com/736x/96/90/d3/9690d3282e3461f7ac2d3cc4a366d52b.jpg'
   
  ];

  // Load saved data from localStorage
  const loadSavedData = () => {
    try {
      const saved = localStorage.getItem("lastCity");
      if (saved) {
        const { city: savedCity, country: savedCountry } = JSON.parse(saved);
        return { city: savedCity, country: savedCountry };
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      localStorage.removeItem("lastCity");
    }
    return null;
  };

  // Save data to localStorage
  const saveToLocalStorage = (cityName, countryName) => {
    try {
      localStorage.setItem("lastCity", JSON.stringify({ 
        city: cityName, 
        country: countryName 
      }));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Get current date in YYYY-MM-DD format for API
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  // Convert prayer time from one timezone to another
  const convertPrayerTime = (timeString, fromTimezone, toTimezone) => {
    // Parse the time string (HH:MM format)
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Get current date in source timezone
    const now = new Date();
    const sourceDateStr = now.toLocaleString('en-US', { 
      timeZone: fromTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const [month, day, year] = sourceDateStr.split('/');
   
    // Create date string for the prayer time
    const dateTimeISO = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

    const testDate = new Date(dateTimeISO);
    
    const formatter1 = new Intl.DateTimeFormat('en-US', {
      timeZone: fromTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const formatter2 = new Intl.DateTimeFormat('en-US', {
      timeZone: toTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    

    
    // Get current UTC time
    const utcNow = Date.now();
    
    // Get what this UTC time is in source timezone
    const sourceTimeStr = new Date(utcNow).toLocaleString('en-US', {
      timeZone: fromTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Get what this UTC time is in target timezone  
    const targetTimeStr = new Date(utcNow).toLocaleString('en-US', {
      timeZone: toTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const [sh, sm] = sourceTimeStr.split(':').map(Number);
    const [th, tm] = targetTimeStr.split(':').map(Number);
    const sourceMinutes = sh * 60 + sm;
    const targetMinutes = th * 60 + tm;
    let offsetDiff = targetMinutes - sourceMinutes;
    
    if (Math.abs(offsetDiff) > 12 * 60) {
      offsetDiff = offsetDiff > 0 ? offsetDiff - 24 * 60 : offsetDiff + 24 * 60;
    }
    
    let totalMinutes = hours * 60 + minutes + offsetDiff;
    
    totalMinutes = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
    
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  };

  const fetchPrayerTimes = async (cityName, countryName, showMeccaTimes = false, latitude = null, longitude = null) => {
    setLoading(true);
    setError('');
    try {
      let finalCountry = countryName;
      if (!countryName && cityName.includes(',')) {
        const parts = cityName.split(',').map(part => part.trim());
        if (parts.length > 1) {
          cityName = parts[0];
          finalCountry = parts[1];
        }
      }

      // If showMeccaTimes is true, fetch Mecca times and convert to user's timezone
      const targetCity = showMeccaTimes ? 'Mecca' : cityName;
      const targetCountry = showMeccaTimes ? 'Saudi Arabia' : finalCountry;

      const currentDate = getCurrentDate();
      let apiUrl;
      
      // Use coordinates if available (more accurate), otherwise use city/country
      if (latitude !== null && longitude !== null && !showMeccaTimes) {
        apiUrl = `https://api.aladhan.com/v1/timings/${currentDate}?latitude=${latitude}&longitude=${longitude}&method=2`;
      } else {
        apiUrl = `https://api.aladhan.com/v1/timingsByCity/${currentDate}?city=${encodeURIComponent(targetCity)}&country=${encodeURIComponent(targetCountry || '')}&method=2`;
      }
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.code === 200) {
        let timings = data.data.timings;
        let displayCity = cityName;
        let displayCountry = countryName || userCountry;
        
        // Store location timezone from API
        const apiTimezone = data.data.meta?.timezone || userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        setLocationTimezone(apiTimezone);
        
        // If showing Mecca times, convert them to user's timezone
        if (showMeccaTimes && userTimezone) {
          const meccaTimezone = data.data.meta?.timezone || 'Asia/Riyadh';
          const convertedTimings = {};
          
          Object.keys(timings).forEach(key => {
            convertedTimings[key] = convertPrayerTime(timings[key], meccaTimezone, userTimezone);
          });
          
          timings = convertedTimings;
          displayCity = 'Mecca';
          displayCountry = userCountry || 'Saudi Arabia';
          // When showing converted Mecca times, use user's timezone for display
          setLocationTimezone(userTimezone);
        } else {
          // Extract location info from AlAdhan API response
          let apiCity = null;
          let apiCountry = null;
          
          // Try to get city and country from API metadata
          if (data.data.meta?.timezone) {
            const tzParts = data.data.meta.timezone.split('/');
            if (tzParts.length > 1) {
              apiCity = tzParts[tzParts.length - 1].replace(/_/g, ' ');
            }
          }
          
          if (data.data.meta?.country) {
            apiCountry = data.data.meta.country;
          } else if (data.data.meta?.timezone) {
            const tzParts = data.data.meta.timezone.split('/');
            if (tzParts.length > 1) {
              const region = tzParts[1].replace(/_/g, ' ');
              apiCountry = region;
            }
          }
          
          // Use API data if available, otherwise fall back to provided values
          if (apiCity && !cityName) {
            displayCity = apiCity;
          }
          
          if (apiCountry) {
            displayCountry = apiCountry;
            setUserCountry(apiCountry);
          } else if (finalCountry) {
            displayCountry = finalCountry;
          } else if (userCountry) {
            displayCountry = userCountry;
          }
        }
        
        setPrayerTimes(timings);
        setCity(displayCity);
        setCountry(displayCountry);
        saveToLocalStorage(displayCity, displayCountry);
      } else {
        setError('City not found. Please try "City, Country" format (e.g., "London, UK").');
      }
    } catch (err) {
      setError('Failed to fetch prayer times. Please check your connection and try again.');
      console.error('Fetch error:', err);
    }
    setLoading(false);
    setGeoLoading(false);
  };

  // Get user's location and fetch prayer times
  const getUserLocation = async () => {
    setGeoLoading(true);
    
    // Get user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);
    
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false
          });
        });
        
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // Fetch prayer times using coordinates (more accurate) - AlAdhan API will return location info
        await fetchPrayerTimes('', '', false, lat, lon);
      } catch (error) {
        console.log('Geolocation failed:', error);
        // Try saved data first, then fallback to default
        const savedData = loadSavedData();
        if (savedData) {
          setUserCountry(savedData.country);
          await fetchPrayerTimes(savedData.city, savedData.country, false);
        } else {
          await fetchPrayerTimes('Mecca', 'Saudi Arabia', true);
        }
      }
    } else {
      console.log('Geolocation not supported');
      const savedData = loadSavedData();
      if (savedData) {
        setUserCountry(savedData.country);
        await fetchPrayerTimes(savedData.city, savedData.country, false);
      } else {
        await fetchPrayerTimes('Mecca', 'Saudi Arabia', true);
      }
    }
    
    setGeoLoading(false);
  };

  // Handle search
  const handleSearch = () => {
    if (searchInput.trim()) {
      let searchCity = searchInput.trim();
      let searchCountry = '';
      
      // Check if user entered "City, Country" format
      if (searchInput.includes(',')) {
        const parts = searchInput.split(',').map(part => part.trim());
        if (parts.length > 1) {
          searchCity = parts[0];
          searchCountry = parts[1];
        }
      }
      
      // If searching for Mecca, show Mecca times converted to user's timezone
      // Otherwise, show local times for that city
      const isMeccaSearch = searchCity.toLowerCase() === 'mecca' || 
                           searchCity.toLowerCase() === 'makkah' ||
                           searchCity.toLowerCase() === 'meca';
      
      fetchPrayerTimes(searchCity, searchCountry, isMeccaSearch, null, null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Convert prayer time string to Date object in local timezone
  const prayerTimeToDate = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const prayerDate = new Date(now);
    prayerDate.setHours(hours, minutes, 0, 0);
    return prayerDate;
  };

  // Calculate next prayer and countdown with UTC handling
  useEffect(() => {
    if (!prayerTimes) return;

    const updateCountdown = () => {
      const now = new Date();
      setCurrentTime(now);
      
      const prayers = [
        { name: 'Fajr', time: prayerTimes.Fajr },
        { name: 'Dhuhr', time: prayerTimes.Dhuhr },
        { name: 'Asr', time: prayerTimes.Asr },
        { name: 'Maghrib', time: prayerTimes.Maghrib },
        { name: 'Isha', time: prayerTimes.Isha },
      ];

      let nextPrayerData = null;

      for (let prayer of prayers) {
        const prayerDate = prayerTimeToDate(prayer.time);

        if (prayerDate > now) {
          nextPrayerData = { ...prayer, date: prayerDate };
          break;
        }
      }

      // If no prayer found today, next is Fajr tomorrow
      if (!nextPrayerData) {
        const fajrTime = prayerTimes.Fajr;
        const prayerDate = prayerTimeToDate(fajrTime);
        prayerDate.setDate(prayerDate.getDate() + 1);
        nextPrayerData = { ...prayers[0], date: prayerDate };
      }

      const diff = nextPrayerData.date - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setNextPrayer({
        name: nextPrayerData.name,
        time: nextPrayerData.time,
        countdown: `${String(hours).padStart(2, '0')} : ${String(mins).padStart(2, '0')} : ${String(secs).padStart(2, '0')}`
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);
    
    const savedData = loadSavedData();
    if (savedData) {
      setUserCountry(savedData.country);
      const isMecca = savedData.city.toLowerCase() === 'mecca' || 
                     savedData.city.toLowerCase() === 'makkah' ||
                     savedData.city.toLowerCase() === 'meca';
      fetchPrayerTimes(savedData.city, savedData.country, isMecca, null, null);
    } else {
      getUserLocation();
    }

    setBackgroundIndex(Math.floor(Math.random() * mosqueBackgrounds.length));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundIndex((prev) => (prev + 1) % mosqueBackgrounds.length);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatCurrentTime = (date, timezone) => {
    if (!timezone) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;
    }
    
    const timeStr = date.toLocaleString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    return timeStr;
  };

  return (
  <div 
  className="min-h-screen flex flex-col md:flex-row p-4 md:p-6 transition-all duration-1000 ease-in-out"
  style={{
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.90)), url(${mosqueBackgrounds[backgroundIndex]})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat'
  }}
>
  
  <div className="flex-1 flex flex-col justify-center p-4 md:p-8">
    <div className="mb-8 animate-fade-in-down">
      <h1 className="text-4xl md:text-5xl font-bold text-emerald-800 tracking-wide mb-3 drop-shadow-sm">
        Prayer Times
      </h1>
      <div className="flex items-center gap-2 text-emerald-700 mb-2">
        <MapPin size={20} />
        <h2 className="text-lg md:text-xl font-medium">
          {geoLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Detecting location...
            </span>
          ) : (
            <>
              {city && country ? `${city}, ${country}` : 'Loading...'}
              {city === 'Mecca' && userCountry && (
                <span className="text-sm text-emerald-600 ml-2">
                  (converted to {userCountry} time)
                </span>
              )}
            </>
          )}
        </h2>
      </div>
      <div className="flex items-center gap-2 text-emerald-700">
        <Clock size={16} />
        <p className="text-sm font-medium">
          Current Time: {formatCurrentTime(currentTime, locationTimezone || userTimezone)}
        </p>
      </div>
    </div>

    <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="relative">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter city"
          className="w-full pl-12 pr-24 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:outline-none bg-white/95 shadow-sm text-gray-700 backdrop-blur-sm"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-600 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-emerald-400"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
    </div>

    {loading ? (
      <div className="text-center py-8 ">
        <div className="animate-pulse">
          <div className="h-8 bg-emerald-200 rounded w-3/4 mb-4"></div>
          <div className="h-16 bg-emerald-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    ) : (
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-emerald-100/50 mb-8 animate-fade-in-scale hover:scale-102" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="text-emerald-600" size={24} />
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
            Next Prayer: {nextPrayer.name}
          </h2>
        </div>
        <p className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2 font-mono drop-shadow-sm ">
          {nextPrayer.countdown}
        </p>
        <p className="text-gray-700 font-medium">at {formatTime(nextPrayer.time)}</p>
      </div>
    )}

    <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      <RandomAyah />
    </div>
  </div>

  <div className="flex-1 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8 mt-6 md:mt-0 md:ml-6 border border-white/50 animate-fade-in-left" style={{ animationDelay: '0.4s' }}>
    <h2 className="text-2xl md:text-3xl font-bold text-emerald-800 mb-6 drop-shadow-sm animate-fade-in">
      Today's Prayer Times
    </h2>

    {loading ? (
      <div className="space-y-4 animate-fade-in">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse h-16 bg-emerald-100 rounded-xl"></div>
        ))}
      </div>
    ) : prayerTimes ? (
      <div className="space-y-4">
        {[
          { name: 'Fajr', time: prayerTimes.Fajr, icon: <Sunrise className="text-blue-400" size={28} /> },
          { name: 'Dhuhr', time: prayerTimes.Dhuhr, icon: <Sun className="text-yellow-500" size={28} /> },
          { name: 'Asr', time: prayerTimes.Asr, icon: <SunMedium className="text-orange-500" size={28} /> },
          { name: 'Maghrib', time: prayerTimes.Maghrib, icon: <Sunset className="text-red-500" size={28} /> },
          { name: 'Isha', time: prayerTimes.Isha, icon: <Moon className="text-indigo-500" size={28} /> },
        ].map((prayer, index) => {
          const isNext = prayer.name === nextPrayer.name;
          return (
            <div
              key={prayer.name}
              className={`flex justify-between items-center px-6 py-4 rounded-xl shadow-md transition-all duration-300 animate-fade-in-up ${
                isNext
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white scale-105 shadow-lg'
                  : 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 hover:scale-102 border border-emerald-200'
              }`}
              style={{ animationDelay: `${0.5 + index * 0.1}s` }}
            >
              <div className="flex items-center gap-3">
                <span className={isNext ? "text-white" : "text-emerald-600"}>
                  {prayer.icon}
                </span>
                <span className="font-semibold text-lg">{prayer.name}</span>
              </div>
              <span className={`font-bold text-xl ${isNext ? "text-white" : "text-emerald-700"}`}>
                {formatTime(prayer.time)}
              </span>
            </div>
          );
        })}
      </div>
    ) : null}

    {prayerTimes && (
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { time: prayerTimes.Imsak, label: 'Imsak', icon: <Coffee className="text-emerald-600" size={16} /> },
          { time: prayerTimes.Sunrise, label: 'Sunrise', icon: <Sunrise className="text-emerald-600" size={16} /> },
        ].map((item, index) => (
          <div 
            key={item.label}
            className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg p-3 shadow-sm border border-emerald-200 animate-fade-in-scale"
            style={{ animationDelay: `${1.0 + index * 0.1}s` }}
          >
            <div className="flex items-center gap-2 mb-1">
              {item.icon}
              <p className="text-xs font-medium text-emerald-700">{item.label}</p>
            </div>
            <p className="text-sm font-bold text-emerald-800">{formatTime(item.time)}</p>
          </div>
        ))}
      </div>
    )}
    
    <div className='flex flex-col mt-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 shadow-lg text-white hover:scale-102'>
      <p> I ask Allah for forgiveness [three times]. O Lord! You are Peace, and peace comes from You. Blessed are You, O Possessor of Glory and Bounty.</p>
      <p dir='rtl'>أَسْـتَغْفِرُ الله . (ثَلاثاً) اللّهُـمَّ أَنْـتَ السَّلامُ ، وَمِـنْكَ السَّلام
تَبارَكْتَ يا ذا الجَـلالِ وَالإِكْـرام</p>
    </div>
  </div>
</div>
  );
}