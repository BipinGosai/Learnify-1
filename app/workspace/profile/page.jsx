"use client"
import React, { useContext, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { UserDetailContext } from '@/context/UserDetailContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import axios from 'axios'

// Profile page where users can view and edit their name.
function Profile() {
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset draft values when leaving edit mode.
    if (!isEditing) {
      setNameDraft(userDetail?.name ?? '');
      setError(null);
      setSaving(false);
    }
  }, [isEditing, userDetail?.name]);

  // Enable save only when changes are valid.
  const canSave = useMemo(() => {
    const next = (nameDraft ?? '').trim();
    const current = (userDetail?.name ?? '').trim();
    return !!userDetail?.email && next.length > 0 && next !== current && !saving;
  }, [nameDraft, saving, userDetail?.email, userDetail?.name]);

  const onSave = async () => {
    setError(null);
    setSaving(true);
    try {
      // Persist profile updates via the API.
      const resp = await axios.patch('/api/user', { name: nameDraft });
      const updatedUser = resp?.data;
      if (updatedUser?.email) {
        setUserDetail(updatedUser);
      } else {
        setUserDetail((prev) => ({ ...(prev ?? {}), name: (nameDraft ?? '').trim() }));
      }
      setIsEditing(false);
    } catch (e) {
      const msg = e?.response?.data?.error;
      setError(typeof msg === 'string' ? msg : 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
        <h2 className='font-bold text-3xl mb-7'>Manage your Profile</h2>

        <div className='border border-border rounded-2xl bg-card max-w-xl overflow-hidden'>
          <div className='p-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <div className='text-lg font-semibold text-foreground'>Profile</div>
                <div className='text-sm text-muted-foreground'>Update your basic account details.</div>
              </div>

              <div className='flex gap-2'>
                {!isEditing && (
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={!userDetail?.email}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit profile
                  </Button>
                )}
                <Button asChild variant='destructive' size='sm'>
                  <Link href='/sign-out'>Sign Out</Link>
                </Button>
              </div>
            </div>

            <Separator className='my-5' />

            {!userDetail?.email ? (
              <div className='space-y-4'>
                <div className='text-sm text-muted-foreground'>You are not signed in.</div>
                <div>
                  <Button asChild>
                    <Link href='/sign-in'>Go to Sign In</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='grid gap-1'>
                  <div className='text-sm text-muted-foreground'>Name</div>
                  {isEditing ? (
                    <Input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      placeholder='Your name'
                      aria-label='Name'
                    />
                  ) : (
                    <div className='text-base font-medium text-foreground'>{userDetail?.name ?? '—'}</div>
                  )}
                </div>

                <div className='grid gap-1'>
                  <div className='text-sm text-muted-foreground'>Email</div>
                  <div className='text-base text-foreground'>{userDetail?.email}</div>
                </div>

                {error && <div className='text-sm text-destructive'>{error}</div>}

                {isEditing && (
                  <div className='flex gap-2 pt-2'>
                    <Button variant='outline' onClick={() => setIsEditing(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={onSave} disabled={!canSave}>
                      {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  )
}

export default Profile