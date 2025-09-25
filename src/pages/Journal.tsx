import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useDataVisibility } from '@/hooks/useDataVisibility';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { JournalEntryForm } from '@/components/journal/JournalEntryForm';
import { PageLoading } from '@/components/LoadingSpinner';
import { Navbar } from '@/components/navigation/Navbar';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  TrendingUp, 
  TrendingDown,
  Wallet,
  BarChart3,
  Coins,
  Zap,
  Layers,
  Activity,
  Users,
  Eye,
  Database
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const entryTypeLabels = {
  spot: 'Spot Trading',
  futures: 'Futures',
  wallet: 'Wallet',
  dual_investment: 'Dual Investment',
  liquidity_mining: 'Liquidity Mining',
  liquidity_pool: 'Liquidity Pool',
  other: 'Other'
};

const entryTypeColors = {
  spot: 'bg-primary/20 text-primary',
  futures: 'bg-accent/20 text-accent',
  wallet: 'bg-success/20 text-success',
  dual_investment: 'bg-warning/20 text-warning',
  liquidity_mining: 'bg-purple-500/20 text-purple-500',
  liquidity_pool: 'bg-cyan-500/20 text-cyan-500',
  other: 'bg-muted text-muted-foreground'
};

export default function Journal() {
  const { user, loading: authLoading } = useAuth();
  const { entries, loading: entriesLoading } = useCombinedEntries();
  const { platforms } = usePlatforms();
  const { dataSources, getVisibleSources } = useDataVisibility();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = !searchTerm || 
        entry.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlatform = selectedPlatform === 'all' || entry.platform_id === selectedPlatform;
      const matchesType = selectedType === 'all' || entry.type === selectedType;
      
      return matchesSearch && matchesPlatform && matchesType;
    });
  }, [entries, searchTerm, selectedPlatform, selectedType]);

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'spot':
        return TrendingUp;
      case 'futures':
        return BarChart3;
      case 'wallet':
        return Wallet;
      case 'dual_investment':
        return Coins;
      case 'liquidity_mining':
        return Zap;
      case 'liquidity_pool':
        return Layers;
      default:
        return Activity;
    }
  };

  const getPlatformName = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.name || 'Unknown Platform';
  };

  const formatEntryValue = (entry: any) => {
    if (entry.type === 'spot' && entry.quantity && entry.price_usd) {
      const value = entry.quantity * entry.price_usd;
      return `$${value.toLocaleString()}`;
    }
    if (entry.pnl !== 0) {
      return `${entry.pnl > 0 ? '+' : ''}$${Math.abs(entry.pnl).toLocaleString()}`;
    }
    return '-';
  };

  const getActionBadgeVariant = (type: string, side?: string): "default" | "destructive" | "secondary" | "outline" => {
    if (type === 'spot') {
      return side === 'buy' ? 'default' : 'destructive';
    }
    switch (type) {
      case 'wallet':
        return 'secondary';
      case 'futures':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (authLoading || entriesLoading) {
    return (
      <>
        <Navbar />
        <PageLoading text="Loading your journal..." />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <PageLoading text="Redirecting to login..." />
      </>
    );
  }

  const visibleSources = getVisibleSources();
  const ownEntries = entries.filter(e => !e.isShared);
  const sharedEntries = entries.filter(e => e.isShared);

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Trading Journal
                </h1>
              </div>
              <p className="text-muted-foreground">
                Track and analyze all your crypto trading activities
              </p>
              {entries.length > 0 && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {entries.length} entries from {visibleSources.length} source{visibleSources.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {sharedEntries.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      <span className="text-sm text-accent">
                        {sharedEntries.length} shared
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <Button onClick={() => setIsAddDialogOpen(true)} className="hover-scale">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>

          {/* Filters */}
          <Card className="glass-card fade-in" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by asset, notes..."
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
                    {platforms.map((platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="spot">Spot Trading</SelectItem>
                    <SelectItem value="futures">Futures</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="dual_investment">Dual Investment</SelectItem>
                    <SelectItem value="liquidity_mining">Liquidity Mining</SelectItem>
                    <SelectItem value="liquidity_pool">Liquidity Pool</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data Sources Overview */}
          {visibleSources.length > 1 && (
            <Card className="glass-card fade-in" style={{ animationDelay: '0.15s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Active Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleSources.map((source) => {
                    const sourceEntries = source.sourceType === 'own' 
                      ? ownEntries 
                      : entries.filter(e => e.grant_id === source.sourceId);
                    
                    return (
                      <div 
                        key={source.sourceId}
                        className="p-4 rounded-lg border bg-muted/30 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          {source.sourceType === 'own' ? (
                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="w-3 h-3 text-primary" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center">
                              <Users className="w-3 h-3 text-accent" />
                            </div>
                          )}
                          <span className="font-medium text-sm">{source.sourceName}</span>
                          <Badge 
                            variant={source.sourceType === 'own' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {source.sourceType === 'own' ? 'My Data' : 'Shared'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sourceEntries.length} {sourceEntries.length === 1 ? 'entry' : 'entries'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entries List */}
          <Card className="glass-card fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Journal Entries
                <Badge variant="outline" className="ml-2">
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {entries.length === 0 ? 'No entries yet' : 'No entries match your filters'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {entries.length === 0 
                        ? "Start by adding your first trading journal entry to track your crypto activities."
                        : "Try adjusting your search or filter criteria to find entries."
                      }
                    </p>
                    {entries.length === 0 && (
                      <Button onClick={() => setIsAddDialogOpen(true)} className="hover-scale">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Entry
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEntries.map((entry, index) => {
                    const Icon = getEntryIcon(entry.type);
                    const actionLabel = entry.type === 'spot' 
                      ? entry.side?.toUpperCase() || 'TRADE'
                      : entry.type.toUpperCase().replace('_', ' ');
                    
                    return (
                      <div 
                        key={entry.id} 
                        className="p-4 rounded-lg border hover:bg-accent/5 transition-colors cursor-pointer fade-in"
                        style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={getActionBadgeVariant(entry.type, entry.side)} 
                                  className="text-xs"
                                >
                                  {actionLabel}
                                </Badge>
                                <span className="font-semibold text-lg">{entry.asset}</span>
                                {entry.isShared && (
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-accent" />
                                    <span className="text-xs text-accent">Shared</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {entry.sharer_profile && (
                                  <div className="flex items-center gap-1">
                                    <Avatar className="w-4 h-4">
                                      <AvatarImage src={entry.sharer_profile.avatar_url || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {entry.sharer_profile.username.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{entry.sharer_profile.username}</span>
                                    <span className="mx-1">•</span>
                                  </div>
                                )}
                                <span>
                                  {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                                </span>
                                <span>•</span>
                                <span>{getPlatformName(entry.platform_id || '')}</span>
                                {entry.quantity && (
                                  <>
                                    <span>•</span>
                                    <span>{entry.quantity} units</span>
                                  </>
                                )}
                              </div>
                              
                              {entry.notes && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right space-y-1">
                            <div className="font-semibold text-lg">
                              {formatEntryValue(entry)}
                            </div>
                            
                            {entry.pnl !== 0 && (
                              <div className={`text-sm font-medium ${
                                entry.pnl > 0 ? 'text-success' : 'text-destructive'
                              }`}>
                                P&L: {entry.pnl > 0 ? '+' : ''}${entry.pnl.toLocaleString()}
                              </div>
                            )}
                            
                            <Badge className={entryTypeColors[entry.type as keyof typeof entryTypeColors]}>
                              {entryTypeLabels[entry.type as keyof typeof entryTypeLabels]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <JournalEntryForm 
            onClose={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}