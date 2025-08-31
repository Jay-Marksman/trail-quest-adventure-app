// App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSpeech } from './hooks/useSpeech';
import { useItinerary } from './hooks/useItinerary';
import { useAISuggestions } from './hooks/useAISuggestions';
import { useLocalStorage } from './hooks/useLocalStorage';
import { samplePOIs, mockWeather } from './data/sampleData';
import { Weather, UserPreferences, ViewType } from './types/types';
import NavigationTabs from './components/NavigationTabs';
import PlanningPanel from './components/planning/PlanningPanel';
import POIList from './components/planning/POIList';
import MapPanel from './components/map/MapPanel';
import ItineraryPanel from './components/itinerary/ItineraryPanel';
import SettingsPanel from './components/settings/SettingsPanel';
import AISuggestionsPanel from './components/ai/AISuggestionsPanel';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';

// Constants
const REGIONS = [
  'Blue Ridge Mountains, VA',
  'Appalachian Trail, NH',
  'Historic Boston, MA',
  'Colonial Williamsburg, VA',
  'Great Smoky Mountains, TN'
] as const;

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  interests: [],
  mobilityLevel: 'moderate',
  timePreference: 'flexible'
};

const AdventureApp: React.FC = () => {
  // Core state with localStorage persistence
  const [selectedRegion, setSelectedRegion] = useLocalStorage<string>('selectedRegion', '');
  const [startingPoint, setStartingPoint] = useLocalStorage<string>('startingPoint', '');
  const [currentView, setCurrentView] = useLocalStorage<ViewType>('currentView', 'planning');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Settings state with localStorage persistence
  const [privacyMode, setPrivacyMode] = useLocalStorage<boolean>('privacyMode', false);
  const [offlineMode, setOfflineMode] = useLocalStorage<boolean>('offlineMode', false);
  const [voiceEnabled, setVoiceEnabled] = useLocalStorage<boolean>('voiceEnabled', false);
  const [userPreferences, setUserPreferences] = useLocalStorage<UserPreferences>(
    'userPreferences',
    DEFAULT_USER_PREFERENCES
  );

  // Weather state (not persisted as it's time-sensitive)
  const [weather, setWeather] = useState<Weather | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Custom hooks
  const speak = useSpeech(voiceEnabled);
  
  // Memoized available POIs to prevent unnecessary re-renders
  const availablePOIs = useMemo(
    () => (selectedRegion ? samplePOIs[selectedRegion] || [] : []),
    [selectedRegion]
  );

  const aiSuggestions = useAISuggestions(selectedRegion, availablePOIs, userPreferences);
  const { 
    itinerary, 
    addPOI, 
    removePOI, 
    optimizeItinerary, 
    calculateTotalTime, 
    calculateTotalCost,
    clearItinerary
  } = useItinerary();

  // Memoized handlers to prevent child re-renders
  const handleRegionChange = useCallback((region: string) => {
    setSelectedRegion(region);
    // Clear itinerary when region changes to avoid conflicts
    if (region !== selectedRegion) {
      clearItinerary();
    }
  }, [selectedRegion, setSelectedRegion, clearItinerary]);

  const handleOptimizeItinerary = useCallback(() => {
    try {
      optimizeItinerary();
      speak('Itinerary optimized for best visiting times and travel efficiency.');
    } catch (err) {
      setError('Failed to optimize itinerary. Please try again.');
      console.error('Optimization error:', err);
    }
  }, [optimizeItinerary, speak]);

  const downloadOfflineContent = useCallback(async () => {
    try {
      setIsLoading(true);
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setOfflineMode(true);
      speak('Offline content downloaded. Maps and site information available without internet.');
    } catch (err) {
      setError('Failed to download offline content. Please check your connection.');
      console.error('Offline download error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setOfflineMode, speak]);

  const handleUserPreferencesUpdate = useCallback((updates: Partial<UserPreferences>) => {
    setUserPreferences(prev => ({ ...prev, ...updates }));
  }, [setUserPreferences]);

  // Effects
  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setWeather(mockWeather);
      } catch (err) {
        setError('Failed to load weather data');
        console.error('Weather loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeatherData();
  }, [selectedRegion]); // Reload weather when region changes

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Accessibility: Announce view changes
  useEffect(() => {
    if (voiceEnabled) {
      const viewNames = {
        planning: 'Trip Planning',
        itinerary: 'My Itinerary',
        settings: 'Settings and AI Suggestions'
      };
      speak(`Switched to ${viewNames[currentView]} view`);
    }
  }, [currentView, voiceEnabled, speak]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            🏔️ TrailQuest
          </h1>
          <p className="text-gray-600">
            Plan your perfect outdoor historical adventure
          </p>
          
          {/* Error notification */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
              {error}
            </div>
          )}
          
          {/* Offline indicator */}
          {offlineMode && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              ✓ Offline Ready
            </div>
          )}
        </header>

        <NavigationTabs 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          hasItineraryItems={itinerary.length > 0}
        />

        {currentView === 'planning' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlanningPanel
              selectedRegion={selectedRegion}
              setSelectedRegion={handleRegionChange}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              startingPoint={startingPoint}
              setStartingPoint={setStartingPoint}
              weather={weather}
              regions={REGIONS}
              privacyMode={privacyMode}
            >
              <POIList 
                pois={availablePOIs} 
                addToItinerary={addPOI}
                userPreferences={userPreferences}
                speak={speak}
              />
            </PlanningPanel>
            
            <MapPanel 
              itinerary={itinerary}
              availablePOIs={availablePOIs}
              startingPoint={startingPoint}
              offlineMode={offlineMode}
            />
          </div>
        )}

        {currentView === 'itinerary' && (
          <ItineraryPanel
            itinerary={itinerary}
            removePOI={removePOI}
            optimizeItinerary={handleOptimizeItinerary}
            calculateTotalTime={calculateTotalTime}
            calculateTotalCost={calculateTotalCost}
            speak={speak}
            selectedDate={selectedDate}
            startingPoint={startingPoint}
            clearItinerary={clearItinerary}
          />
        )}

        {currentView === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingsPanel
              privacyMode={privacyMode}
              setPrivacyMode={setPrivacyMode}
              voiceEnabled={voiceEnabled}
              setVoiceEnabled={setVoiceEnabled}
              userPreferences={userPreferences}
              setUserPreferences={handleUserPreferencesUpdate}
              offlineMode={offlineMode}
              downloadOfflineContent={downloadOfflineContent}
              isLoading={isLoading}
            />
            
            <AISuggestionsPanel
              userPreferences={userPreferences}
              setUserPreferences={handleUserPreferencesUpdate}
              aiSuggestions={aiSuggestions}
              selectedRegion={selectedRegion}
              applyAISuggestion={(suggestion) => {
                // Logic to apply AI suggestion to itinerary
                speak(`Applied AI suggestion: ${suggestion.title}`);
              }}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default AdventureApp;
