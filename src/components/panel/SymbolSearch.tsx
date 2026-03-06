// React component for instrument search dropdown
// Works with the fixed search utility

import { useState, useEffect, useRef } from 'react';
import { searchInstruments, debugQuery } from '../../lib/symbol-search-utils';
import { debouncedSearch, searchIndexInstruments } from '../../lib/instrument-api';
import { AnimatePresence, motion } from 'framer-motion';

interface Instrument {
  name?: string;
  description?: string;
  displayName?: string;
  symbol?: string;
  exchangeSegment?: number;
  volume?: number;
  contractExpiration?: string;
  expiry?: string;
  _id?: string;
  [key: string]: any;
}

interface SymbolSearchProps {
  instruments: Instrument[];
  onSelect: (instrument: Instrument) => void;
  placeholder?: string;
  maxResults?: number;
  onDebug?: (info: any) => void;
}

export function SymbolSearch({
  instruments,
  onSelect,
  placeholder = "Search symbol...",
  maxResults = 20,
  onDebug,
}: SymbolSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Instrument[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search whenever query changes
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Perform search
    const searchResults = searchInstruments(instruments, query, { limit: maxResults });
    setResults(searchResults);
    setIsOpen(searchResults.length > 0);
    setSelectedIndex(-1);

    // Debug info
    if (onDebug) {
      const debug = debugQuery(query);
      onDebug({
        query,
        resultsCount: searchResults.length,
        ...debug,
      });
    }
  }, [query, instruments, maxResults, onDebug]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev === 0 ? results.length - 1 : prev - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (instrument: Instrument) => {
    onSelect(instrument);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDisplayText = (inst: Instrument): string => {
    return inst.displayName || inst.name || inst.description || "Unknown";
  };

  const getSubText = (inst: Instrument): string => {
    return inst.description || inst.symbol || "";
  };

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white placeholder-gray-500"
        />
        {/* Search Icon */}
        <svg
          className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {results.map((instrument, index) => (
            <div
              key={instrument._id || index}
              onClick={() => handleSelect(instrument)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0 ${
                selectedIndex === index ? "bg-blue-600" : "hover:bg-gray-700"
              }`}
            >
              {/* Main text - Display name or name */}
              <div className="font-semibold text-white">
                {getDisplayText(instrument)}
              </div>

              {/* Sub text - Description */}
              <div className="text-sm text-gray-400 truncate">
                {getSubText(instrument)}
              </div>

              {/* Extra info - Exchange segment and expiry */}
              <div className="text-xs text-gray-500 mt-1">
                {instrument.exchangeSegment === 1 && "📊 Futures"}
                {instrument.exchangeSegment === 3 && "📈 Options"}
                {instrument.exchangeSegment === 0 && "📍 Stock"}
                {instrument.expiry && (
                  <span className="ml-2">
                    ⏰ {new Date(instrument.expiry).toLocaleDateString("en-IN")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && results.length === 0 && query.trim() !== "" && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-400 text-center">
          No instruments found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}

// API-based SymbolSearch component (default export for CreateSymbolDrawer)
export default function SymbolSearchAPI({
	onSymbolSelect,
	placeholder = "Search for symbols...",
	exchangeSegment = null,
	showPopular = true,
	className = "",
	strategyType = "stocks",
}) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<any[]>([]);
	const [popular, setPopular] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);

	const inputRef = useRef<any>(null);
	const dropdownRef = useRef<any>(null);

	// Handle search with debouncing
	useEffect(() => {
		if (query.length >= 2) {
			setLoading(true);
			
			// If strategyType is 'options', search in index_instruments
			if (strategyType === 'options') {
				searchIndexInstruments(query, 50)
					.then((response: any) => {
						const instruments = response?.data?.instruments || [];
						setResults(instruments);
						setLoading(false);
					})
					.catch((error) => {
						console.error("Index search error:", error);
						setResults([]);
						setLoading(false);
					});
			} else {
				// Normal search in XtsInstrument
				debouncedSearch(query, 300, 50, exchangeSegment, strategyType)
					.then((response: any) => {
						const instruments = response?.data?.instruments || [];
						setResults(instruments);
						setLoading(false);
					})
					.catch((error) => {
						console.error("Search error:", error);
						setResults([]);
						setLoading(false);
					});
			}
		} else {
			setResults([]);
		}
	}, [query, exchangeSegment, strategyType]);

	// Handle click outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setShowDropdown(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleInputChange = (e) => {
		const value = e.target.value;
		setQuery(value);
		setShowDropdown(true);
		setSelectedIndex(-1);
	};

	const handleInputFocus = () => {
		setShowDropdown(true);
	};

	const handleSymbolSelect = (instrument) => {
		setQuery(instrument.displayName || instrument.name);
		setShowDropdown(false);
		setSelectedIndex(-1);
		onSymbolSelect(instrument);
	};

	const handleKeyDown = (e) => {
		const items = query.length >= 2 ? results : popular;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (selectedIndex >= 0 && selectedIndex < items.length) {
				handleSymbolSelect(items[selectedIndex]);
			}
		} else if (e.key === "Escape") {
			setShowDropdown(false);
			setSelectedIndex(-1);
		}
	};

	const getExchangeBadgeColor = (segment) => {
		switch (segment) {
			case 1:
				return "bg-blue-100 text-blue-700 border-blue-300";
			case 2:
				return "bg-green-100 text-green-700 border-green-300";
			case 3:
				return "bg-orange-100 text-orange-700 border-orange-300";
			default:
				return "bg-gray-100 text-gray-700 border-gray-300";
		}
	};

	const getExchangeName = (segment) => {
		switch (segment) {
			case 1:
				return "NSE F&O";
			case 2:
				return "NSE Cash";
			case 3:
				return "MCX F&O";
			default:
				return "Unknown";
		}
	};

	const displayItems = query.length >= 2 ? results : popular;
	const showResults = showDropdown && (loading || query.length >= 2 || displayItems.length > 0);

	return (
		<div className={`relative ${className}`} ref={dropdownRef}>
			{/* Search Input */}
			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={handleInputChange}
					onFocus={handleInputFocus}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400"
				/>
				<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
					{loading ? (
						<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
					) : (
						<svg
							className="w-5 h-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Search Icon</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					)}
				</div>
			</div>

			{/* Dropdown Results */}
			<AnimatePresence>
				{showResults && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto dark:bg-gray-900 dark:border-gray-700"
					>
						{loading ? (
							<div className="p-4 text-center text-gray-500">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
								Searching...
							</div>
						) : displayItems.length > 0 ? (
							<>
								{query.length < 2 && (
									<div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700">
										Popular Symbols
									</div>
								)}
								{displayItems.map((instrument: any, index) => (
									<motion.div
										key={instrument?.id || instrument?._id || index}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.02 }}
										className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors ${
											selectedIndex === index ? "bg-blue-50" : ""
										} dark:border-gray-800 dark:hover:bg-gray-800`}
										onClick={() => handleSymbolSelect(instrument)}
									>
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<div className="font-semibold text-gray-900 dark:text-gray-100">
													{instrument.name}
												</div>
												<div className="text-sm text-gray-500 dark:text-gray-300">
													{instrument.description || "N/A"}
												</div>
												<div className="text-xs text-gray-400 mt-1 dark:text-gray-400">
													Exchange ID: {instrument.exchangeInstrumentID || instrument.instrumentToken}
												</div>
											</div>
											<div className="flex flex-col items-end gap-1">
												<span
													className={`px-2 py-1 text-xs font-semibold rounded-full border ${getExchangeBadgeColor(instrument.exchangeSegment)} dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700`}
												>
													{instrument.exchangeName || getExchangeName(instrument.exchangeSegment)}
												</span>
												{instrument.lotSize && (
													<div className="text-xs text-gray-400 dark:text-gray-400">
														Lot: {instrument.lotSize}
													</div>
												)}
											</div>
										</div>
									</motion.div>
								))}
							</>
						) : query.length >= 2 ? (
							<div className="p-4 text-center text-gray-500">
								<div className="text-4xl mb-2">🔍</div>
								No symbols found for &quot;{query}&quot;
							</div>
						) : null}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ============= USAGE EXAMPLE =============
/*
import { useEffect, useState } from 'react';

export function TradingConfigStep() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Fetch instruments from API
  useEffect(() => {
    fetch('/api/instruments')
      .then(res => res.json())
      .then(data => setInstruments(data))
      .catch(err => console.error('Failed to fetch instruments:', err));
  }, []);

  const handleSelectInstrument = (instrument: Instrument) => {
    console.log('Selected:', instrument);
    setSelectedInstrument(instrument);
    // Continue with trading config...
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Configure Trading</h2>
        <p className="text-gray-400">Step 2 of 2</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Select Symbol</label>
        <SymbolSearch
          instruments={instruments}
          onSelect={handleSelectInstrument}
          placeholder="Search symbol (e.g., 'nifty nov', 'axisbank dec fut')"
          maxResults={20}
          onDebug={setDebugInfo}
        />
      </div>

      {selectedInstrument && (
        <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded p-4">
          <p className="text-green-400">✅ Selected: {selectedInstrument.displayName}</p>
        </div>
      )}

      {debugInfo && (
        <details className="text-xs text-gray-400">
          <summary>Debug Info</summary>
          <pre className="mt-2 bg-gray-900 p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
*/