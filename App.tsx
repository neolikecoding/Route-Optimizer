import React, { useState, useCallback } from 'react';
import { AppStep, Address, AddressStatus } from './types';
import { parseExcelFile } from './utils/excelParser';
import { parseAndValidateAddresses, optimizeRoute } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { AddressTable } from './components/AddressTable';
import { RouteDisplay } from './components/RouteDisplay';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';

// This script relies on the xlsx library being loaded from a CDN in index.html
declare const XLSX: any;

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.Upload);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<Address[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  
  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setStep(AppStep.Processing);
    setProcessingMessage('Reading Excel file...');
    
    try {
      const parsedRows = await parseExcelFile(file);
      const initialAddresses: Address[] = parsedRows.map((row, index) => ({
        id: index,
        originalData: row.originalData,
        fullAddress: row.fullAddress,
        status: AddressStatus.Processing,
      }));
      setAddresses(initialAddresses);
      
      setProcessingMessage('Validating addresses with AI...');
      
      const onProgress = (processed: number, total: number) => {
        setProcessingMessage(`Validating addresses with AI... (${processed}/${total})`);
      };

      const rawAddressStrings = parsedRows.map(p => p.fullAddress);
      const validatedData = await parseAndValidateAddresses(rawAddressStrings, onProgress);

      const updatedAddresses = initialAddresses.map(addr => {
        const match = validatedData.find(v => v.originalAddress.toLowerCase() === addr.fullAddress.toLowerCase());
        if (match) {
          if (match.isValid) {
            return {
              ...addr,
              houseNumber: match.houseNumber,
              streetName: match.streetName,
              city: match.city,
              state: match.state,
              zip: match.zip,
              status: AddressStatus.Validated,
            };
          }
          return {
            ...addr,
            status: AddressStatus.Error,
            error: match.error || 'Address could not be validated.',
          };
        }
        return {
          ...addr,
          status: AddressStatus.Error,
          error: 'Address not found in AI response.',
        };
      });

      setAddresses(updatedAddresses);
      setStep(AppStep.Results);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setStep(AppStep.Upload);
      setAddresses([]);
    }
  }, []);

  const handleOptimizeRoute = useCallback(async () => {
    setError(null);
    setProcessingMessage('Optimizing route with AI...');
    setIsOptimizing(true);
    
    const validAddresses = addresses.filter(a => a.status === AddressStatus.Validated);
    if (validAddresses.length < 2) {
      setError("At least two valid addresses are required to optimize a route.");
      setIsOptimizing(false);
      return;
    }

    try {
      const route = await optimizeRoute(validAddresses);
      setOptimizedRoute(route);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsOptimizing(false);
    }
  }, [addresses]);

  const handleDownloadExcel = useCallback(() => {
    try {
      const dataToExport = addresses.map(addr => ({
        ...addr.originalData,
        'House Number': addr.houseNumber || '',
        'Street Name': addr.streetName || '',
        'City': addr.city || '',
        'State': addr.state || '',
        'Zip': addr.zip || '',
        'Validation Status': addr.status,
        'Validation Error': addr.error || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Processed Addresses');
      XLSX.writeFile(workbook, 'route_optimizer_results.xlsx');
    } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while creating the Excel file.';
       setError(errorMessage);
    }
  }, [addresses]);

  const handleReset = () => {
    setStep(AppStep.Upload);
    setAddresses([]);
    setOptimizedRoute(null);
    setError(null);
    setProcessingMessage('');
  };

  const renderContent = () => {
    switch (step) {
      case AppStep.Processing:
        return (
          <div className="text-center p-8">
            <SpinnerIcon className="h-12 w-12 mx-auto text-indigo-600" />
            <p className="mt-4 text-lg font-medium text-slate-700">{processingMessage}</p>
            <p className="mt-1 text-sm text-slate-500">Please wait, this may take a moment...</p>
          </div>
        );
      case AppStep.Results:
        const validAddressCount = addresses.filter(a => a.status === AddressStatus.Validated).length;
        return (
            <div className="w-full max-w-7xl">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-slate-800">Validation Results</h2>
                  <div className="flex items-center space-x-3">
                     <button
                        onClick={handleDownloadExcel}
                        className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                    >
                        <DownloadIcon className="-ml-0.5 h-5 w-5" />
                        Download Results
                    </button>
                    <button
                        onClick={handleReset}
                        className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        Start Over
                    </button>
                  </div>
                </div>

                <AddressTable addresses={addresses} />

                {optimizedRoute ? (
                    <div className="mt-12">
                         <RouteDisplay route={optimizedRoute} />
                    </div>
                ) : (
                  <div className="mt-8 border-t border-slate-200 pt-8 text-center">
                    <button
                        onClick={handleOptimizeRoute}
                        disabled={validAddressCount < 2 || isOptimizing}
                        className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                        {isOptimizing ? (
                          <>
                            <SpinnerIcon className="h-5 w-5 mr-2" />
                            Optimizing...
                          </>
                        ) : (
                          `Optimize Route (${validAddressCount} valid)`
                        )}
                    </button>
                  </div>
                )}
            </div>
        );
      case AppStep.Upload:
      default:
        return (
            <div className="w-full">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6 max-w-2xl mx-auto" role="alert">
                        <strong className="font-bold">An error occurred: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                <FileUpload onFileUpload={handleFileUpload} disabled={step === AppStep.Processing} />
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Route Optimizer AI
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
            Upload an Excel file of addresses, and our AI will validate them and create the most efficient route for you.
          </p>
        </header>

        <main className="flex justify-center">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;