'use client';

import { useState } from 'react';
import {
  MessageCircle,
  Trash2,
  CheckCircle2,
  Clock,
  Plus,
  BellRing,
  BellOff,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useWhatsapp } from '@/hooks/useWhatsapp';

export default function WhatsappSettingsPage() {
  const { numbers, linkNumber, unlinkNumber, enableDigest, disableDigest } = useWhatsapp();
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    await linkNumber.mutateAsync(phoneNumber.trim());
    setPhoneNumber('');
  };

  const unavailable = numbers.isError;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
          <MessageCircle className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">WhatsApp</h1>
          <p className="text-sm text-slate-500">
            Link your WhatsApp number to manage tasks via chat and receive a daily digest.
          </p>
        </div>
      </div>

      {unavailable && (
        <div className="card p-6 border-l-4 border-l-amber-400">
          <p className="text-sm text-slate-700 font-medium">
            WhatsApp integration is not available.
          </p>
          <p className="text-sm text-slate-500 mt-1">
            The WhatsApp/OpenWA integration is currently disabled on this server. Ask
            your administrator to enable it to link a number.
          </p>
        </div>
      )}

      {!unavailable && (
        <>
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-slate-900 mb-1">Link a new number</h2>
            <p className="text-sm text-slate-500 mb-4">
              Enter your number in international format (e.g. +91 98765 43210).
            </p>
            <form onSubmit={handleLink} className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label="WhatsApp number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <Button type="submit" disabled={linkNumber.isPending || !phoneNumber.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                {linkNumber.isPending ? 'Linking...' : 'Link'}
              </Button>
            </form>
            {linkNumber.isError && (
              <p className="mt-2 text-sm text-red-600">
                {(linkNumber.error as Error)?.message || 'Failed to link number'}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {numbers.isLoading && (
              <p className="text-sm text-slate-400">Loading linked numbers...</p>
            )}

            {numbers.data?.map((number) => (
              <div key={number.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-mono font-medium text-slate-900">
                      +{number.phoneNumber}
                    </p>
                    {number.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        Pending verification
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => unlinkNumber.mutate(number.id)}
                    disabled={unlinkNumber.isPending}
                    className="text-slate-400 hover:text-red-500 disabled:opacity-50"
                    title="Unlink number"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {!number.isVerified && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <p className="font-medium text-slate-700">Verify this number</p>
                    <p className="mt-1">
                      Send the following code to the PawaacFlow WhatsApp bot from this
                      number to verify it:
                    </p>
                    <p className="mt-2 text-lg font-mono font-bold tracking-widest text-primary-600">
                      {number.verificationCode || '------'}
                    </p>
                  </div>
                )}

                {number.isVerified && (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Daily digest</p>
                      <p className="text-xs text-slate-500">
                        {number.dailyDigestEnabled
                          ? `Enabled - sent around ${number.dailyDigestTime}`
                          : 'Receive a morning summary of your open tasks.'}
                      </p>
                    </div>
                    {number.dailyDigestEnabled ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => disableDigest.mutate()}
                        disabled={disableDigest.isPending}
                      >
                        <BellOff className="h-4 w-4 mr-1" />
                        Disable
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => enableDigest.mutate()}
                        disabled={enableDigest.isPending}
                      >
                        <BellRing className="h-4 w-4 mr-1" />
                        Enable
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {numbers.data?.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <MessageCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                No WhatsApp numbers linked yet.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
