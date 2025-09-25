import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useDataVisibility } from '@/hooks/useDataVisibility';
import { JournalEntryForm } from '@/components/journal/JournalEntryForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function Journal() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: entries, loading: entriesLoading, refetch } = useCombinedEntries();
  const { data: platforms } = usePlatforms();
  const { isVisible } = useDataVisibility();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    
    return entries.filter(entry => {
      const matchesSearch = entry.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.symbol?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = selectedPlatform === 'all' || entry.platform_id === selectedPlatform;
      const matchesType = selectedType === 'all' || entry.type === selectedType;
      
      return matchesSearch && matchesPlatform && matchesType;
    });
  }, [entries, searchTerm, selectedPlatform, selectedType]);

  const handleEntrySubmit = () => {
    refetch();
    setIsAddDialogOpen(false);
    setEditingEntry(null);
  };

  if (authLoading || entriesLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'bg-green-100 text-green-800';
      case 'sell':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trading Journal</h1>
          <p className="text-gray-600 mt-2">Track and analyze your trading activities</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Journal Entry</DialogTitle>
            </DialogHeader>
            <JournalEntryForm onSubmit={handleEntrySubmit} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {platforms?.map((platform) => (
              <SelectItem key={platform.id} value={platform.id}>
                {platform.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="sell">Sell</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No entries found</h3>
              <p className="text-gray-600 text-center mb-4">
                {entries?.length === 0 
                  ? "Start by adding your first trading journal entry"
                  : "Try adjusting your search or filter criteria"
                }
              </p>
              {entries?.length === 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Entry
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(entry.type)}
                    <div>
                      <CardTitle className="text-lg">{entry.symbol}</CardTitle>
                      <CardDescription>
                        {new Date(entry.date).toLocaleDateString()} • 
                        {platforms?.find(p => p.id === entry.platform_id)?.name || 'Unknown Platform'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(entry.type)}>
                      {entry.type?.toUpperCase()}
                    </Badge>
                    {isVisible('amount') && entry.amount && (
                      <Badge variant="outline">
                        ${entry.amount.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {entry.notes && (
                <CardContent className="pt-0">
                  <p className="text-gray-700">{entry.notes}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Journal Entry</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <JournalEntryForm 
              entry={editingEntry} 
              onSubmit={handleEntrySubmit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}