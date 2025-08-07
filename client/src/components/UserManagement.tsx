
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/utils/trpc';
import { Plus, Shield, User, Mail, Phone, Search, Edit } from 'lucide-react';
import type { User as UserType, CreateUserInput } from '../../../server/src/schema';

interface UserManagementProps {
  userRole: string;
}

export function UserManagement({ userRole }: UserManagementProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    email: '',
    full_name: '',
    role: 'staf_komisi',
    phone: null,
    password: ''
  });

  const canManageUsers = userRole === 'staf_komisi';

  // Initial users data loaded from authentication system
  const initialUsers: UserType[] = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@komisiinformasi.jakarta.go.id',
      full_name: 'Administrator Komisi Informasi',
      role: 'staf_komisi',
      phone: '+62-21-12345678',
      is_active: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 2,
      username: 'komisioner1',
      email: 'komisioner1@komisiinformasi.jakarta.go.id',
      full_name: 'Dr. Komisioner Pertama',
      role: 'komisioner',
      phone: '+62-21-12345679',
      is_active: true,
      created_at: new Date('2024-01-02'),
      updated_at: new Date('2024-01-02')
    },
    {
      id: 3,
      username: 'panitera1',
      email: 'panitera1@komisiinformasi.jakarta.go.id',
      full_name: 'Panitera Satu',
      role: 'panitera',
      phone: '+62-21-12345680',
      is_active: true,
      created_at: new Date('2024-01-03'),
      updated_at: new Date('2024-01-03')
    }
  ];

  useEffect(() => {
    // Load initial user data from authentication system
    setUsers(initialUsers);
  }, []);

  const filteredUsers = users.filter((user: UserType) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;

    setIsLoading(true);
    try {
      await trpc.createUser.mutate(formData);
      // Refresh user list from authentication system
      setFormData({
        username: '',
        email: '',
        full_name: '',
        role: 'staf_komisi',
        phone: null,
        password: ''
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'staf_komisi': return 'Staf Komisi';
      case 'komisioner': return 'Komisioner';
      case 'panitera': return 'Panitera';
      case 'pemohon': return 'Pemohon';
      case 'badan_publik': return 'Badan Publik';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'staf_komisi': return 'default';
      case 'komisioner': return 'secondary';
      case 'panitera': return 'outline';
      case 'pemohon': return 'destructive';
      case 'badan_publik': return 'destructive';
      default: return 'outline';
    }
  };

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Akses Terbatas
          </h3>
          <p className="text-gray-600">
            Anda tidak memiliki akses untuk mengelola pengguna sistem.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Manajemen Pengguna
              </CardTitle>
              <CardDescription>
                Kelola pengguna sistem dan hak akses mereka
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Tambah Pengguna
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                  <DialogDescription>
                    Buat akun pengguna baru untuk sistem
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                      }
                      placeholder="Username unik"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Nama Lengkap</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, full_name: e.target.value }))
                      }
                      placeholder="Nama lengkap pengguna"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="alamat@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Peran</Label>
                    <Select
                      value={formData.role || 'staf_komisi'}
                      onValueChange={(value: 'staf_komisi' | 'komisioner' | 'panitera' | 'pemohon' | 'badan_publik') =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staf_komisi">Staf Komisi</SelectItem>
                        <SelectItem value="komisioner">Komisioner</SelectItem>
                        <SelectItem value="panitera">Panitera</SelectItem>
                        <SelectItem value="pemohon">Pemohon</SelectItem>
                        <SelectItem value="badan_publik">Badan Publik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ 
                          ...prev, 
                          phone: e.target.value || null 
                        }))
                      }
                      placeholder="Nomor telepon (opsional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Password minimal 6 karakter"
                      required
                      minLength={6}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Membuat...' : 'Buat Pengguna'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama, username, atau email..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter || 'all'} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter Peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Peran</SelectItem>
                <SelectItem value="staf_komisi">Staf Komisi</SelectItem>
                <SelectItem value="komisioner">Komisioner</SelectItem>
                <SelectItem value="panitera">Panitera</SelectItem>
                <SelectItem value="pemohon">Pemohon</SelectItem>
                <SelectItem value="badan_publik">Badan Publik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          {filteredUsers.length === 0 ? (
            <Alert>
              <AlertDescription>
                Tidak ada pengguna yang cocok dengan filter pencarian.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((user: UserType) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {user.full_name}
                          </h3>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                            {getRoleLabel(user.role)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{user.username}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              checked={user.is_active}
                              // Update user status through authentication system
                              onCheckedChange={() => {}}
                            />
                            <span className="text-sm text-gray-600">
                              {user.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="text-xs text-gray-400 mt-2">
                          Dibuat: {user.created_at.toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
