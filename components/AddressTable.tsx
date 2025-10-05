import React from 'react';
import { Address, AddressStatus } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface AddressTableProps {
  addresses: Address[];
}

const StatusIndicator: React.FC<{ status: AddressStatus }> = ({ status }) => {
  switch (status) {
    case AddressStatus.Processing:
      return <SpinnerIcon className="h-5 w-5 text-indigo-500" />;
    case AddressStatus.Validated:
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case AddressStatus.Error:
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    default:
      return null;
  }
};

export const AddressTable: React.FC<AddressTableProps> = ({ addresses }) => {
  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-slate-300">
              <thead className="bg-slate-100">
                <tr>
                  <th scope="col" className="w-12 px-3 py-3.5 text-center text-sm font-semibold text-slate-900">
                    Status
                  </th>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">
                    Original Address
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                    House No.
                  </th>
                   <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                    Street Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                    City
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                    State
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                    Zip Code
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {addresses.map((address) => (
                  <tr key={address.id} className={address.status === AddressStatus.Error ? 'bg-red-50' : ''}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                      <div className="flex justify-center">
                        <StatusIndicator status={address.status} />
                      </div>
                    </td>
                    <td className="py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">
                        {address.fullAddress}
                        {address.status === AddressStatus.Error && (
                            <p className="mt-1 text-xs text-red-600">{address.error}</p>
                        )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{address.houseNumber || '...'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{address.streetName || '...'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{address.city || '...'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{address.state || '...'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{address.zip || '...'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
