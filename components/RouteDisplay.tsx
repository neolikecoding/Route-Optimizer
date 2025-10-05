import React from 'react';
import { Address } from '../types';

interface RouteDisplayProps {
  route: Address[];
}

const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
);

export const RouteDisplay: React.FC<RouteDisplayProps> = ({ route }) => {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold leading-6 text-slate-900">Optimized Route</h3>
      <p className="mt-2 text-sm text-slate-600">
        Follow these stops in order for the most efficient route.
      </p>
      <div className="mt-6 flow-root">
        <ul role="list" className="-mb-8">
          {route.map((address, addressIdx) => (
            <li key={address.id}>
              <div className="relative pb-8">
                {addressIdx !== route.length - 1 ? (
                  <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                ) : null}
                <div className="relative flex space-x-3 items-start">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ${addressIdx === 0 ? 'bg-indigo-500 ring-indigo-200' : 'bg-white ring-slate-300'}`}>
                      {addressIdx === 0 ? (
                        <MapPinIcon className="h-5 w-5 text-white" />
                      ) : (
                        <span className={`text-sm font-semibold ${addressIdx === route.length -1 ? 'text-slate-600' : 'text-slate-500'}`}>{addressIdx + 1}</span>
                      )}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5">
                    <p className="text-sm font-medium text-slate-800">
                        {address.houseNumber} {address.streetName}, {address.city}, {address.state} {address.zip}
                    </p>
                    <p className="text-xs text-slate-500">{address.fullAddress}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
