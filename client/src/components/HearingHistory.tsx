
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle }from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { Plus, Calendar, Clock, Users, FileText, Edit } from 'lucide-react';
import type { Dispute, Hearing, CreateHearingInput, UpdateHearingInput } from '../../../server/src/schema';

interface HearingHistoryProps {
  disputes: Dispute[];
  userRole: string;
}

export function HearingHistory({ disputes, userRole }: HearingHistoryProps) {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingHearing, setEditingHearing] = useState<Hearing | null>(null);

  const [formData, setFormData] = useState<CreateHearingInput>({
    dispute_id: 0,
    hearing_date: new Date(),
    agenda: '',
    result: null,
    decision: null,
    attendees: null
  });

  const [editFormData, setEditFormData] = useState<UpdateHearingInput>({
    id: 0,
    hearing_date: undefined,
    agenda: undefined,
    result: undefined,
    decision: undefined,
    attendees: undefined
  });

  const canCreateHearing = ['staf_komisi', 'komisioner'].includes(userRole);
  const canEditHearing = ['staf_komisi', 'komisioner'].includes(userRole);
  const canViewResults = ['staf_komisi', 'komisioner', 'panitera', 'pemohon', 'badan_publik'].includes(userRole);

  const loadHearings = useCallback(async (disputeId: number) => {
    setIsLoading(true);
    try {
      const result = await trpc.getHearingsByDispute.query({ dispute_id: disputeId });
      setHearings(result);
    } catch (error) {
      console.error('Failed to load hearings:', error);
      setHearings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDispute) {
      loadHearings(selectedDispute);
    } else {
      setHearings([]);
    }
  }, [selectedDispute, loadHearings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createHearing.mutate(formData);
      if (selectedDispute) {
        await loadHearings(selectedDispute);
      }
      setFormData({
        dispute_id: selectedDispute || 0,
        hearing_date: new Date(),
        agenda: '',
        result: null,
        decision: null,
        attendees: null
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create hearing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.updateHearing.mutate(editFormData);
      if (selectedDispute) {
        await loadHearings(selectedDispute);
      }
      setShowEditDialog(false);
      setEditingHearing(null);
    } catch (error) {
      console.error('Failed to update hearing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    if (selectedDispute) {
      setFormData({
        dispute_id: selectedDispute,
        hearing_date: new Date(),
        agenda: '',
        result: null,
        decision: null,
        attendees: null
      });
      setShowCreateDialog(true);
    }
  };

  const openEditDialog = (hearing: Hearing) => {
    setEditingHearing(hearing);
    setEditFormData({
      id: hearing.id,
      hearing_date: hearing.hearing_date,
      agenda: hearing.agenda,
      result: hearing.result,
      decision: hearing.decision,
      attendees: hearing.attendees
    });
    setShowEditDialog(true);
  };

  const getSelectedDisputeInfo = () => {
    if (!selectedDispute) return null;
    return disputes.find(d => d.id === selectedDispute);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Riwayat Persidangan
              </CardTitle>
              <CardDescription>
                Kelola jadwal dan hasil persidangan untuk setiap sengketa
              </CardDescription>
            </div>
            {canCreateHearing && selectedDispute && (
              <Button onClick={openCreateDialog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah Persidangan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="dispute_select">Pilih Sengketa</Label>
            <Select
              value={selectedDispute?.toString() || ''}
              onValueChange={(value: string) => setSelectedDispute(value ? parseInt(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih sengketa untuk melihat riwayat persidangan" />
              </SelectTrigger>
              <SelectContent>
                {disputes.map((dispute: Dispute) => (
                  <SelectItem key={dispute.id} value={dispute.id.toString()}>
                    {dispute.dispute_number} - {dispute.dispute_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDispute && getSelectedDisputeInfo() && (
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-900">
                  Informasi Sengketa
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Nomor:</span>{' '}
                    {getSelectedDisputeInfo()?.dispute_number}
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Status:</span>{' '}
                    <Badge variant="outline" className="ml-1">
                      {getSelectedDisputeInfo()?.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedDispute ? (
            <Alert>
              <AlertDescription>
                Pilih sengketa untuk melihat riwayat persidangan.
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <Alert>
              <AlertDescription>Memuat data persidangan...</AlertDescription>
            </Alert>
          ) : hearings.length === 0 ? (
            <Alert>
              <AlertDescription>
                Belum ada riwayat persidangan untuk sengketa ini.
                {canCreateHearing && ' Klik tombol "Tambah Persidangan" untuk membuat jadwal baru.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {hearings.map((hearing: Hearing) => (
                <Card key={hearing.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Persidangan #{hearing.id}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            {hearing.hearing_date.toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      {canEditHearing && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(hearing)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4" />
                          Agenda Persidangan
                        </h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                          {hearing.agenda}
                        </p>
                      </div>

                      {hearing.attendees && (
                        <div>
                          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4" />
                            Pihak yang Hadir
                          </h4>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                            {hearing.attendees}
                          </p>
                        </div>
                      )}

                      {canViewResults && hearing.result && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Hasil Persidangan
                          </h4>
                          <p className="text-gray-700 bg-green-50 p-3 rounded-md">
                            {hearing.result}
                          </p>
                        </div>
                      )}

                      {canViewResults && hearing.decision && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Keputusan
                          </h4>
                          <p className="text-gray-700 bg-amber-50 p-3 rounded-md font-medium">
                            {hearing.decision}
                          </p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 pt-2 border-t">
                        Dibuat pada: {hearing.created_at.toLocaleDateString('id-ID')} {hearing.created_at.toLocaleTimeString('id-ID')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Persidangan Baru</DialogTitle>
            <DialogDescription>
              Jadwalkan persidangan untuk sengketa {getSelectedDisputeInfo()?.dispute_number}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="hearing_date">Tanggal dan Waktu Persidangan</Label>
              <Input
                id="hearing_date"
                type="datetime-local"
                value={formData.hearing_date.toISOString().slice(0, 16)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateHearingInput) => ({ 
                    ...prev, 
                    hearing_date: new Date(e.target.value) 
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="agenda">Agenda Persidangan</Label>
              <Textarea
                id="agenda"
                value={formData.agenda}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateHearingInput) => ({ ...prev, agenda: e.target.value }))
                }
                placeholder="Jelaskan agenda yang akan dibahas dalam persidangan ini..."
                required
              />
            </div>
            <div>
              <Label htmlFor="attendees">Pihak yang Hadir (Opsional)</Label>
              <Textarea
                id="attendees"
                value={formData.attendees || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateHearingInput) => ({ 
                    ...prev, 
                    attendees: e.target.value || null 
                  }))
                }
                placeholder="Daftar pihak yang diundang atau hadir..."
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Persidangan</DialogTitle>
            <DialogDescription>
              Ubah informasi persidangan #{editingHearing?.id}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit_hearing_date">Tanggal dan Waktu Persidangan</Label>
              <Input
                id="edit_hearing_date"
                type="datetime-local"
                value={editFormData.hearing_date?.toISOString().slice(0, 16) || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateHearingInput) => ({ 
                    ...prev, 
                    hearing_date: new Date(e.target.value) 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_agenda">Agenda Persidangan</Label>
              <Textarea
                id="edit_agenda"
                value={editFormData.agenda || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateHearingInput) => ({ ...prev, agenda: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_result">Hasil Persidangan</Label>
              <Textarea
                id="edit_result"
                value={editFormData.result || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateHearingInput) => ({ 
                    ...prev, 
                    result: e.target.value || null 
                  }))
                }
                placeholder="Catat hasil atau kesimpulan persidangan..."
              />
            </div>
            <div>
              <Label htmlFor="edit_decision">Keputusan</Label>
              <Textarea
                id="edit_decision"
                value={editFormData.decision || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateHearingInput) => ({ 
                    ...prev, 
                    decision: e.target.value || null 
                  }))
                }
                placeholder="Keputusan resmi dari persidangan..."
              />
            </div>
            <div>
              <Label htmlFor="edit_attendees">Pihak yang Hadir</Label>
              <Textarea
                id="edit_attendees"
                value={editFormData.attendees || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateHearingInput) => ({ 
                    ...prev, 
                    attendees: e.target.value || null 
                  }))
                }
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
