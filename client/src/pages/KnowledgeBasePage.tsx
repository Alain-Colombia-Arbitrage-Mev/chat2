import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Papa from "papaparse";
import {
  Search,
  Plus,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Upload,
  X,
  Loader2,
  Globe,
  Link,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Zap,
  Pencil,
  Check,
  Lightbulb,
  BarChart3,
  Filter,
  Calendar,
  FileUp,
  FileText,
} from "lucide-react";
import { 
  getQaPairs, 
  createQaPair, 
  deleteQaPair, 
  batchUpdateQaPairs,
  batchCreateQaPairs,
  getUnansweredQuestions,
  convertUnansweredToFaq,
  getUserFromUrl,
  getScrapedUrls,
  scrapeUrl,
  crawlWebsite,
  deleteScrapedUrl,
  rescrapeUrl,
  rescrapeAllUrls,
  getClientConfig,
  updateClientConfig,
  getErrorStats,
  getKnowledgeGaps,
  getKnowledgeGapStats,
  resolveKnowledgeGap,
  getDocuments,
  uploadDocument,
  uploadDocuments,
  deleteDocument,
  type ScrapedUrl,
  type ScrapeResult,
  type CrawlResult,
  type RescrapeResult,
  type RescrapeAllResult,
  type ErrorStats,
  type KnowledgeGap,
  type KnowledgeGapPriority,
  type KnowledgeGapCategory,
  type UploadedDocument,
  type BatchUploadResult,
} from "@/lib/api";
import { qaPairSchema, type QAPairFormValues } from "@/lib/schemas";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function KnowledgeBasePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [convertItemId, setConvertItemId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk add state - multi-row entries
  const [bulkEntries, setBulkEntries] = useState<{topic: string; question: string; answer: string}[]>([
    { topic: "General", question: "", answer: "" },
    { topic: "General", question: "", answer: "" },
    { topic: "General", question: "", answer: "" },
  ]);

  // Inline add row state
  const [inlineEntry, setInlineEntry] = useState({ topic: "General", question: "", answer: "" });

  // Batch editing state
  const [pendingEdits, setPendingEdits] = useState<Record<string, Partial<any>>>({});
  const hasChanges = Object.keys(pendingEdits).length > 0;
  const changesCount = Object.keys(pendingEdits).length;

  // Website scraping state
  const [scrapeUrlInput, setScrapeUrlInput] = useState("");
  const [crawlUrlInput, setCrawlUrlInput] = useState("");
  const [maxPages, setMaxPages] = useState(10);
  const [scrapeMode, setScrapeMode] = useState<"single" | "crawl">("single");
  const [showAdditionalScrape, setShowAdditionalScrape] = useState(false);
  
  // Store URL editing state
  const [isEditingStoreUrl, setIsEditingStoreUrl] = useState(false);
  const [storeUrlInput, setStoreUrlInput] = useState("");
  const [storeUrlError, setStoreUrlError] = useState("");

  // Knowledge Gaps filter state
  const [kgStatusFilter, setKgStatusFilter] = useState<"open" | "resolved" | "all">("open");
  const [kgPriorityFilter, setKgPriorityFilter] = useState<KnowledgeGapPriority | "all">("all");
  const [kgCategoryFilter, setKgCategoryFilter] = useState<KnowledgeGapCategory | "all">("all");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Resolve dialog state
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [resolveItemId, setResolveItemId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  
  // Add FAQ from knowledge gap state
  const [kgAddFaqItem, setKgAddFaqItem] = useState<KnowledgeGap | null>(null);

  // Document upload state
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  // Fetch client config for website URL
  const { data: clientConfig } = useQuery({
    queryKey: ["client-config"],
    queryFn: () => getClientConfig(),
  });
  
  // Get website URL from client config
  const clientWebsiteUrl = clientConfig?.website || "";
  
  // URL validation function - ensures https:// prefix and valid domain
  const validateUrl = (url: string): { isValid: boolean; error: string; formattedUrl: string } => {
    let formattedUrl = url.trim();
    
    // Check for empty input
    if (!formattedUrl) {
      return { isValid: false, error: "Please enter a domain", formattedUrl: "" };
    }
    
    // Add https:// if no protocol present
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }
    
    // Force https (convert http to https)
    formattedUrl = formattedUrl.replace(/^http:\/\//, "https://");
    
    // Try to parse as URL
    try {
      const urlObj = new URL(formattedUrl);
      
      // Check for valid TLD (must have at least one dot in hostname)
      const hostname = urlObj.hostname;
      if (!hostname.includes(".")) {
        return { isValid: false, error: "URL must include a valid domain (e.g., .com, .store)", formattedUrl };
      }
      
      // Check that hostname has a valid TLD pattern (at least 2 chars)
      const tld = hostname.split(".").pop() || "";
      if (tld.length < 2) {
        return { isValid: false, error: "URL must include a valid domain extension", formattedUrl };
      }
      
      return { isValid: true, error: "", formattedUrl };
    } catch {
      return { isValid: false, error: "Please enter a valid URL (e.g., yourstore.com)", formattedUrl };
    }
  };
  
  // Mutation to update website URL
  const updateWebsiteUrlMutation = useMutation({
    mutationFn: (website: string) => updateClientConfig({ website }),
    onSuccess: () => {
      toast({ title: "Store URL Updated", description: "Your website URL has been saved." });
      setIsEditingStoreUrl(false);
      setStoreUrlError("");
      queryClient.invalidateQueries({ queryKey: ["client-config"] });
    },
    onError: (error: Error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });
  
  // Handle save store URL
  const handleSaveStoreUrl = () => {
    const validation = validateUrl(storeUrlInput);
    if (!validation.isValid) {
      setStoreUrlError(validation.error);
      return;
    }
    setStoreUrlError("");
    updateWebsiteUrlMutation.mutate(validation.formattedUrl);
  };
  
  // Handle start editing - strip https:// prefix for editing
  const handleStartEditingUrl = () => {
    setStoreUrlInput(clientWebsiteUrl.replace(/^https?:\/\//, ""));
    setIsEditingStoreUrl(true);
    setStoreUrlError("");
  };
  
  // Handle cancel editing
  const handleCancelEditingUrl = () => {
    setIsEditingStoreUrl(false);
    setStoreUrlError("");
    setStoreUrlInput("");
  };

  // Fetch QA pairs
  const { data: faqs = [], isLoading: loadingFaqs } = useQuery({
    queryKey: ["qaPairs"],
    queryFn: () => getQaPairs(),
  });

  // Auto-resize textareas when FAQ data loads
  useEffect(() => {
    if (!loadingFaqs && faqs.length > 0) {
      // Small delay to ensure DOM is rendered
      requestAnimationFrame(() => {
        const textareas = document.querySelectorAll<HTMLTextAreaElement>('[data-autoresize="true"]');
        textareas.forEach(textarea => {
          textarea.style.height = "auto";
          textarea.style.height = textarea.scrollHeight + "px";
        });
      });
    }
  }, [faqs, loadingFaqs, pendingEdits]);

  // Fetch unanswered questions
  const { data: unanswered = [], isLoading: loadingUnanswered } = useQuery({
    queryKey: ["unansweredQuestions"],
    queryFn: () => getUnansweredQuestions(),
  });

  // Fetch scraped URLs
  const { data: scrapedUrls = [], isLoading: loadingScrapedUrls } = useQuery({
    queryKey: ["scrapedUrls"],
    queryFn: () => getScrapedUrls(),
  });

  // Fetch uploaded documents
  const { data: documents = [], isLoading: loadingDocuments } = useQuery({
    queryKey: ["documents"],
    queryFn: () => getDocuments(),
  });

  // Upload single document mutation
  const uploadDocMutation = useMutation({
    mutationFn: (file: File) => uploadDocument(file),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Document Uploaded",
        description: `${doc.fileName}: ${doc.chunkCount} chunks indexed.`
      });
    },
    onError: (error: Error) => {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    },
  });

  // Batch upload mutation
  const batchUploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadDocuments(files),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setUploadProgress(null);
      if (result.failCount === 0) {
        toast({
          title: "Documents Uploaded",
          description: `${result.successCount} document(s) processed (${result.results.reduce((sum, r) => sum + (r.chunksCreated || 0), 0)} chunks total).`
        });
      } else {
        toast({
          title: "Upload Complete",
          description: `${result.successCount} succeeded, ${result.failCount} failed.`,
          variant: result.successCount > 0 ? undefined : "destructive",
        });
      }
    },
    onError: (error: Error) => {
      setUploadProgress(null);
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    },
  });

  // Delete document mutation
  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => deleteDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document Deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    },
  });

  // Handle document file upload
  const handleDocUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        toast({ title: "File Too Large", description: `${f.name} exceeds 10MB limit.`, variant: "destructive" });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      event.target.value = "";
      return;
    }

    if (validFiles.length === 1) {
      uploadDocMutation.mutate(validFiles[0]);
    } else {
      setUploadProgress({ current: 0, total: validFiles.length });
      batchUploadMutation.mutate(validFiles);
    }
    event.target.value = "";
  };

  // Handle drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(f => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (!ext || !["pdf", "docx", "txt"].includes(ext)) {
        toast({ title: "Unsupported Type", description: `${f.name} is not a supported file type.`, variant: "destructive" });
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast({ title: "File Too Large", description: `${f.name} exceeds 10MB limit.`, variant: "destructive" });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    if (validFiles.length === 1) {
      uploadDocMutation.mutate(validFiles[0]);
    } else {
      setUploadProgress({ current: 0, total: validFiles.length });
      batchUploadMutation.mutate(validFiles);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Fetch error stats for error indicator
  const { data: errorStats } = useQuery({
    queryKey: ["errorStats"],
    queryFn: () => getErrorStats(),
    refetchInterval: 60000,
  });

  // Fetch knowledge gaps from MongoDB
  const { data: knowledgeGapsData, isLoading: loadingKnowledgeGaps } = useQuery({
    queryKey: ["knowledgeGaps", kgStatusFilter, kgPriorityFilter, kgCategoryFilter],
    queryFn: () => getKnowledgeGaps({
      resolved: kgStatusFilter === "all" ? undefined : kgStatusFilter === "resolved",
      priority: kgPriorityFilter === "all" ? undefined : kgPriorityFilter,
      category: kgCategoryFilter === "all" ? undefined : kgCategoryFilter,
      limit: 100,
    }),
  });

  const knowledgeGaps = knowledgeGapsData?.knowledge_gaps || [];
  const knowledgeGapsCount = knowledgeGapsData?.count || 0;

  // Resolve knowledge gap mutation
  const resolveKnowledgeGapMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => 
      resolveKnowledgeGap(id, { resolution_notes: notes, resolved_by: getUserFromUrl() || "admin" }),
    onSuccess: () => {
      toast({ title: "Resolved", description: "Knowledge gap marked as resolved." });
      setIsResolveDialogOpen(false);
      setResolveItemId(null);
      setResolveNotes("");
      queryClient.invalidateQueries({ queryKey: ["knowledgeGaps"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Scrape single URL mutation
  const scrapeMutation = useMutation({
    mutationFn: (url: string) => scrapeUrl(url),
    onSuccess: (result) => {
      toast({ 
        title: "Page Scraped", 
        description: `Successfully scraped "${result.pageTitle}" - ${result.chunksCreated} content chunks created.` 
      });
      setScrapeUrlInput("");
      queryClient.invalidateQueries({ queryKey: ["scrapedUrls"] });
    },
    onError: (error: Error) => {
      toast({ title: "Scrape Failed", description: error.message, variant: "destructive" });
    },
  });

  // Crawl website mutation
  const crawlMutation = useMutation({
    mutationFn: ({ url, maxPages }: { url: string; maxPages: number }) =>
      crawlWebsite(url, { maxPages }),
    onSuccess: (result) => {
      toast({ 
        title: "Website Crawled", 
        description: `Scraped ${result.pagesScraped} pages with ${result.totalChunks} content chunks.` 
      });
      setCrawlUrlInput("");
      queryClient.invalidateQueries({ queryKey: ["scrapedUrls"] });
    },
    onError: (error: Error) => {
      toast({ title: "Crawl Failed", description: error.message, variant: "destructive" });
    },
  });

  // Delete scraped URL mutation
  const deleteScrapedMutation = useMutation({
    mutationFn: (url: string) => deleteScrapedUrl(url),
    onSuccess: (result) => {
      toast({ title: "Deleted", description: `Removed ${result.deletedChunks} content chunks.` });
      queryClient.invalidateQueries({ queryKey: ["scrapedUrls"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete scraped content.", variant: "destructive" });
    },
  });

  // Track which URL is currently being rescraped
  const [rescrapingUrl, setRescrapingUrl] = useState<string | null>(null);

  // Rescrape single URL mutation
  const rescrapeMutation = useMutation({
    mutationFn: (url: string) => {
      setRescrapingUrl(url);
      return rescrapeUrl(url);
    },
    onSuccess: (result) => {
      setRescrapingUrl(null);
      toast({ 
        title: "Refreshed", 
        description: `Updated with ${result.newChunks} new content chunks.` 
      });
      queryClient.invalidateQueries({ queryKey: ["scrapedUrls"] });
    },
    onError: () => {
      setRescrapingUrl(null);
      toast({ title: "Error", description: "Failed to refresh page content.", variant: "destructive" });
    },
  });

  // Rescrape all URLs mutation
  const rescrapeAllMutation = useMutation({
    mutationFn: () => rescrapeAllUrls(),
    onSuccess: (result) => {
      toast({ 
        title: "Refresh Complete", 
        description: `Refreshed ${result.successfulRescrapes} of ${result.totalUrls} pages.` 
      });
      queryClient.invalidateQueries({ queryKey: ["scrapedUrls"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to refresh all pages.", variant: "destructive" });
    },
  });

  // Filter and sort FAQs using Weaviate's internal creation timestamp
  const filteredFaqs = faqs
    .filter((faq: any) => 
      faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.topic?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      const timeA = a.creationTimeUnix || 0;
      const timeB = b.creationTimeUnix || 0;
      return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
    });

  // Toggle sort direction
  const toggleSort = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  // Format date for display using creationTimeUnix
  const formatDate = (creationTimeUnix: number | null | undefined) => {
    if (!creationTimeUnix) return "—";
    const date = new Date(creationTimeUnix);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  // Auto-resize textareas on initial render
  useEffect(() => {
    const textareas = document.querySelectorAll<HTMLTextAreaElement>('[data-autoresize="true"]');
    textareas.forEach((textarea) => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    });
  }, [faqs, pendingEdits]);

  const form = useForm<QAPairFormValues>({
    resolver: zodResolver(qaPairSchema),
    defaultValues: {
      topic: "General",
      question: "",
      answer: ""
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: QAPairFormValues) =>
      createQaPair({ topic: data.topic, question: data.question, answer: data.answer }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["qaPairs"] });
      if (convertItemId) {
        queryClient.invalidateQueries({ queryKey: ["unansweredQuestions"] });
        setConvertItemId(null);
      }
      if (kgAddFaqItem) {
        try {
          await resolveKnowledgeGap(kgAddFaqItem._id, { 
            resolution_notes: "FAQ added from suggested question", 
            resolved_by: getUserFromUrl() || "admin" 
          });
          queryClient.invalidateQueries({ queryKey: ["knowledgeGaps"] });
        } catch (e) {
          console.error("Failed to auto-resolve knowledge gap:", e);
        }
        setKgAddFaqItem(null);
      }
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "FAQ Added",
        description: "New knowledge base entry created successfully.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQaPair,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qaPairs"] });
      toast({
        title: "Deleted",
        description: "Entry removed from knowledge base.",
      });
    },
  });

  const batchUpdateMutation = useMutation({
    mutationFn: batchUpdateQaPairs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qaPairs"] });
      setPendingEdits({});
      toast({
        title: "Batch Update Successful",
        description: `Saved changes to ${changesCount} vector(s).`,
      });
    },
  });

  const convertMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      convertUnansweredToFaq(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qaPairs"] });
      queryClient.invalidateQueries({ queryKey: ["unansweredQuestions"] });
      setIsAddDialogOpen(false);
      setConvertItemId(null);
      form.reset();
      toast({
        title: "FAQ Added",
        description: "Question converted to knowledge base entry.",
      });
    },
  });

  const batchCreateMutation = useMutation({
    mutationFn: (items: {topic: string; question: string; answer: string}[]) =>
      batchCreateQaPairs(items),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["qaPairs"] });
      setIsBulkAddOpen(false);
      setBulkEntries([
        { topic: "General", question: "", answer: "" },
        { topic: "General", question: "", answer: "" },
        { topic: "General", question: "", answer: "" },
      ]);
      toast({
        title: "FAQs Added",
        description: `Successfully created ${data.length} FAQ entries.`,
      });
    },
  });

  // Bulk add handlers
  const updateBulkEntry = (index: number, field: string, value: string) => {
    setBulkEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const addBulkRow = () => {
    setBulkEntries(prev => [...prev, { topic: "General", question: "", answer: "" }]);
  };

  const removeBulkRow = (index: number) => {
    setBulkEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkSubmit = () => {
    const validEntries = bulkEntries.filter(e => e.question.trim() && e.answer.trim());
    if (validEntries.length === 0) {
      toast({ title: "Error", description: "Please fill in at least one FAQ entry.", variant: "destructive" });
      return;
    }
    batchCreateMutation.mutate(validEntries);
  };

  // CSV Import handler using PapaParse for robust CSV parsing
  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const rows = results.data as string[][];
        
        // Skip header row if it looks like a header
        const startIndex = rows[0]?.[0]?.toLowerCase().includes('topic') || 
                          rows[0]?.[0]?.toLowerCase().includes('question') ? 1 : 0;
        
        const entries: {topic: string; question: string; answer: string}[] = [];
        for (let i = startIndex; i < rows.length; i++) {
          const parts = rows[i];
          if (!parts || parts.length < 2) continue;
          
          // Filter out empty rows
          const hasContent = parts.some(p => p && p.trim());
          if (!hasContent) continue;
          
          entries.push({
            topic: parts.length >= 3 ? (parts[0]?.trim() || "General") : "General",
            question: parts.length >= 3 ? (parts[1]?.trim() || "") : (parts[0]?.trim() || ""),
            answer: parts.length >= 3 ? (parts[2]?.trim() || "") : (parts[1]?.trim() || ""),
          });
        }

        // Filter out entries without question or answer
        const validEntries = entries.filter(e => e.question && e.answer);

        if (validEntries.length > 0) {
          batchCreateMutation.mutate(validEntries);
        } else {
          toast({ title: "Error", description: "No valid entries found in CSV.", variant: "destructive" });
        }
      },
      error: (error) => {
        toast({ title: "Error", description: `Failed to parse CSV: ${error.message}`, variant: "destructive" });
      },
      skipEmptyLines: true,
    });
    
    event.target.value = '';
  };

  // Inline add handler with loading guard
  const handleInlineAdd = () => {
    if (!inlineEntry.question.trim() || !inlineEntry.answer.trim()) return;
    if (createMutation.isPending) return;
    
    createMutation.mutate({
      topic: inlineEntry.topic || "General",
      question: inlineEntry.question,
      answer: inlineEntry.answer,
    });
    setInlineEntry({ topic: "General", question: "", answer: "" });
  };

  const handleEdit = (id: string, field: string, value: string) => {
    setPendingEdits(prev => {
      const currentEdit = prev[id] || {};
      return {
        ...prev,
        [id]: { ...currentEdit, [field]: value }
      };
    });
  };

  const handleSaveBatch = () => {
    const updates = Object.entries(pendingEdits).map(([id, data]) => ({ id, ...data }));
    batchUpdateMutation.mutate(updates);
  };

  const handleCancelBatch = () => {
    if (confirm("Discard all pending changes?")) {
      setPendingEdits({});
    }
  };

  const handleAddFaq = (data: QAPairFormValues) => {
    if (convertItemId) {
      convertMutation.mutate({
        id: convertItemId,
        data: {
          topic: data.topic,
          question: data.question,
          answer: data.answer,
        }
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const openConvertDialog = (item: any) => {
    setConvertItemId(item.id);
    form.setValue("question", item.question);
    form.setValue("answer", item.inputResponse || "");
    form.setValue("topic", "General");
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this vector? This cannot be undone.")) {
      deleteMutation.mutate(id);
      // Also remove from pending if exists
      const { [id]: _, ...rest } = pendingEdits;
      setPendingEdits(rest);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl tracking-tight">
            Knowledge Base
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            Manage FAQs and train your bot on unanswered questions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2" 
            data-testid="button-export-csv"
            onClick={() => {
              const escapeCSV = (str: string) => `"${(str || "").replace(/"/g, '""')}"`;
              const csvContent = [
                ["Topic", "Question", "Answer"],
                ...faqs.map((qa: any) => [
                  escapeCSV(qa.topic || "General"),
                  escapeCSV(qa.question || ""),
                  escapeCSV(qa.answer || "")
                ])
              ].map(row => row.join(",")).join("\n");
              
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `faqs_${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={16} /> Export CSV
          </Button>

          {/* Test Agent removed - now on dedicated Test Chat page */}
        </div>
      </div>

      {/* Floating Action Bar for Changes */}
      <div className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform",
        hasChanges ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
      )}>
        <div className="bg-foreground text-background rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 border border-border/20">
          <div className="flex items-center gap-2 font-medium">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            {changesCount} Unsaved Change{changesCount !== 1 ? 's' : ''}
          </div>
          <div className="h-4 w-px bg-background/20"></div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-8 hover:bg-background/20 text-background hover:text-background" onClick={handleCancelBatch} data-testid="button-discard-changes">
              Discard
            </Button>
            <Button 
              size="sm" 
              className="h-8 text-white hover:opacity-90 transition-opacity border-0" 
              style={{ backgroundColor: "hsl(var(--primary))" }}
              onClick={handleSaveBatch}
              data-testid="button-save-changes"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="faqs" className="w-full">
        <TabsList className="mb-6 w-full md:w-auto grid grid-cols-3 md:inline-flex">
          <TabsTrigger value="faqs" data-testid="tab-faqs">FAQs & Knowledge</TabsTrigger>
          <TabsTrigger value="websites" className="relative" data-testid="tab-websites">
            <Globe size={14} className="mr-1.5" />
            Content Sources
            {(scrapedUrls.length + documents.length) > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {scrapedUrls.length + documents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="unanswered" 
            className="relative bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:border-orange-500" 
            data-testid="tab-unanswered"
          >
            Unanswered Questions
            {kgStatusFilter === "open" && knowledgeGapsCount > 0 && (
              <span className="ml-2 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                {knowledgeGapsCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="space-y-6">
          <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border/50 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search questions, answers, topics..." 
                className="pl-9 bg-muted/50 border-transparent focus:bg-background focus:border-input transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-faqs"
              />
            </div>
            
            {/* CSV Import - hidden for now */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleCsvImport}
              className="hidden"
            />

            {/* Bulk Add Dialog */}
            <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-bulk-add">
                  <Plus size={16} className="mr-2" /> Bulk Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bulk Add FAQs</DialogTitle>
                  <DialogDescription>
                    Add multiple FAQ entries at once. Fill in the fields below.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {bulkEntries.map((entry, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="w-24 shrink-0">
                        <Input
                          placeholder="Topic"
                          value={entry.topic}
                          onChange={(e) => updateBulkEntry(index, "topic", e.target.value)}
                          className="h-9"
                          data-testid={`bulk-topic-${index}`}
                        />
                      </div>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Question"
                          value={entry.question}
                          onChange={(e) => updateBulkEntry(index, "question", e.target.value)}
                          className="min-h-[36px] py-2 resize-none"
                          rows={1}
                          data-testid={`bulk-question-${index}`}
                        />
                      </div>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Answer"
                          value={entry.answer}
                          onChange={(e) => updateBulkEntry(index, "answer", e.target.value)}
                          className="min-h-[36px] py-2 resize-none"
                          rows={1}
                          data-testid={`bulk-answer-${index}`}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeBulkRow(index)}
                        disabled={bulkEntries.length <= 1}
                        data-testid={`bulk-remove-${index}`}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addBulkRow} className="w-full" data-testid="button-add-row">
                    <Plus size={14} className="mr-1" /> Add Row
                  </Button>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBulkAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleBulkSubmit} disabled={batchCreateMutation.isPending} data-testid="button-submit-bulk">
                    {batchCreateMutation.isPending ? "Creating..." : `Create ${bulkEntries.filter(e => e.question && e.answer).length} FAQs`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Single Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setConvertItemId(null); form.reset(); }} data-testid="button-add-faq">
                  <Plus size={16} className="mr-2" /> Add FAQ
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{convertItemId ? "Convert to FAQ" : "Add New FAQ"}</DialogTitle>
                  <DialogDescription>
                    Create a new knowledge base entry for your bot.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddFaq)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Returns, Shipping" {...field} data-testid="input-faq-topic" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="question"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question</FormLabel>
                          <FormControl>
                            <Input placeholder="What is the question?" {...field} data-testid="input-faq-question" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Answer</FormLabel>
                          <FormControl>
                            <Textarea placeholder="How should the bot answer?" className="min-h-[100px]" {...field} data-testid="input-faq-answer" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" data-testid="button-save-faq">Save Entry</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border border-border/50 overflow-hidden shadow-sm bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">
                    <button 
                      onClick={toggleSort} 
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      data-testid="button-sort-date"
                    >
                      Created
                      {sortDirection === "asc" ? (
                        <ArrowUp size={14} />
                      ) : (
                        <ArrowDown size={14} />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="w-[120px]">Topic</TableHead>
                  <TableHead className="w-[30%]">Question</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingFaqs ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredFaqs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No results found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFaqs.map((faq: any) => {
                    const isDirty = !!pendingEdits[faq.id];
                    const edits = pendingEdits[faq.id] || {};
                    const displayItem = { ...faq, ...edits };

                    return (
                      <TableRow key={faq.id} className={cn("group", isDirty ? "bg-orange-500/5 hover:bg-orange-500/10" : "")} data-testid={`row-faq-${faq.id}`}>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap align-top pt-3">
                          {formatDate(faq.creationTimeUnix)}
                        </TableCell>
                        <TableCell className="align-top">
                           <Input 
                            value={displayItem.topic}
                            onChange={(e) => handleEdit(faq.id, "topic", e.target.value)}
                            className={cn("h-8 bg-transparent border-transparent hover:border-input focus:bg-background px-2", edits.topic && "text-orange-600 font-medium")}
                            data-testid={`input-faq-topic-${faq.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-foreground/90 align-top">
                          <Textarea 
                            value={displayItem.question}
                            onChange={(e) => {
                              handleEdit(faq.id, "question", e.target.value);
                              e.target.style.height = "auto";
                              e.target.style.height = e.target.scrollHeight + "px";
                            }}
                            data-autoresize="true"
                            className={cn("min-h-[2.5rem] py-2 resize-none bg-transparent border-transparent hover:border-input focus:bg-background px-2 overflow-hidden", edits.question && "text-orange-600 font-medium")}
                            data-testid={`input-faq-question-${faq.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground align-top">
                          <Textarea 
                            value={displayItem.answer}
                            onChange={(e) => {
                              handleEdit(faq.id, "answer", e.target.value);
                              e.target.style.height = "auto";
                              e.target.style.height = e.target.scrollHeight + "px";
                            }}
                            data-autoresize="true"
                            className={cn("min-h-[2.5rem] py-2 resize-none bg-transparent border-transparent hover:border-input focus:bg-background px-2 overflow-hidden", edits.answer && "text-orange-600 font-medium")}
                            data-testid={`input-faq-answer-${faq.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(faq.id)}
                            data-testid={`button-delete-faq-${faq.id}`}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                {/* Inline Add Row */}
                <TableRow className="bg-muted/30 border-t-2 border-dashed">
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap align-top pt-3">
                    <span className="text-green-600 font-medium">New</span>
                  </TableCell>
                  <TableCell className="align-top">
                    <Input 
                      value={inlineEntry.topic}
                      onChange={(e) => setInlineEntry(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="Topic"
                      className="h-8 bg-background border-input px-2"
                      data-testid="inline-topic"
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <Textarea 
                      value={inlineEntry.question}
                      onChange={(e) => setInlineEntry(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="Enter question..."
                      className="min-h-[2.5rem] py-2 resize-none bg-background border-input px-2"
                      rows={1}
                      data-testid="inline-question"
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <Textarea 
                      value={inlineEntry.answer}
                      onChange={(e) => setInlineEntry(prev => ({ ...prev, answer: e.target.value }))}
                      placeholder="Enter answer..."
                      className="min-h-[2.5rem] py-2 resize-none bg-background border-input px-2"
                      rows={1}
                      data-testid="inline-answer"
                    />
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <Button 
                      size="sm"
                      onClick={handleInlineAdd}
                      disabled={!inlineEntry.question.trim() || !inlineEntry.answer.trim() || createMutation.isPending}
                      className="h-8"
                      style={{ backgroundColor: "hsl(var(--primary))" }}
                      data-testid="button-inline-add"
                    >
                      <Plus size={14} className="mr-1" /> Add
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="unanswered" className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-lg border border-border/50 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter size={16} />
              <span>Filters:</span>
            </div>
            
            {/* Status Filter */}
            <Select value={kgStatusFilter} onValueChange={(v) => setKgStatusFilter(v as "open" | "resolved" | "all")}>
              <SelectTrigger className="w-[130px] h-9" data-testid="select-kg-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={kgPriorityFilter} onValueChange={(v) => setKgPriorityFilter(v as KnowledgeGapPriority | "all")}>
              <SelectTrigger className="w-[130px] h-9" data-testid="select-kg-priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={kgCategoryFilter} onValueChange={(v) => setKgCategoryFilter(v as KnowledgeGapCategory | "all")}>
              <SelectTrigger className="w-[140px] h-9" data-testid="select-kg-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="returns">Returns</SelectItem>
                <SelectItem value="pricing">Pricing</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto text-sm text-muted-foreground">
              {knowledgeGapsCount} question{knowledgeGapsCount !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Knowledge Gaps Cards */}
          <div className="space-y-4">
            {loadingKnowledgeGaps ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground bg-card rounded-lg border border-border/50">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : knowledgeGaps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground bg-card rounded-lg border border-border/50">
                <CheckCircle2 size={32} className="text-green-500 mb-2" />
                <p>{kgStatusFilter === "open" ? "All questions resolved!" : "No questions found matching filters."}</p>
              </div>
            ) : (
              knowledgeGaps.map((item: KnowledgeGap) => {
                const priority = item.knowledge_gap_analysis?.priority || "low";
                const category = item.knowledge_gap_analysis?.gap_category || "general";
                const suggestedFaq = item.knowledge_gap_analysis?.suggested_faq;
                const analysis = item.knowledge_gap_analysis;
                const isExpanded = expandedCards.has(item._id);
                
                const toggleExpanded = () => {
                  setExpandedCards(prev => {
                    const next = new Set(prev);
                    if (next.has(item._id)) {
                      next.delete(item._id);
                    } else {
                      next.add(item._id);
                    }
                    return next;
                  });
                };
                
                return (
                  <div 
                    key={item._id} 
                    data-testid={`card-knowledge-gap-${item._id}`}
                    className={cn(
                      "bg-card rounded-lg border shadow-sm overflow-hidden transition-all",
                      item.resolved ? "opacity-60 border-border/30" : "border-border/50",
                      priority === "high" && !item.resolved && "border-l-4 border-l-red-500"
                    )}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/30">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={priority === "high" ? "destructive" : priority === "medium" ? "default" : "secondary"}
                          className={cn(
                            "text-xs capitalize font-medium",
                            priority === "high" && "bg-red-500 hover:bg-red-600",
                            priority === "medium" && "bg-yellow-500 hover:bg-yellow-600 text-black",
                            priority === "low" && "bg-muted-foreground hover:bg-muted-foreground/80"
                          )}
                          data-testid={`badge-priority-${item._id}`}
                        >
                          {priority === "high" ? "HIGH" : priority === "medium" ? "MEDIUM" : "LOW"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{item.contact_name || "Unknown"}</span>
                        {item.contact_id && (
                          <a
                            href={`https://app.phntmai.com/v2/location/${item.location_id}/contacts/detail/${item.contact_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            data-testid={`link-contact-${item._id}`}
                            title="Open contact"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        {isExpanded && (
                          <Badge variant="outline" className="text-xs capitalize" data-testid={`badge-category-${item._id}`}>
                            {category}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-4 space-y-4">
                      {/* Customer Question */}
                      <div>
                        {isExpanded && <div className="text-xs font-medium text-muted-foreground mb-1">Customer Question</div>}
                        <p className="text-foreground font-medium">"{item.customer_question}"</p>
                      </div>
                      
                      {/* Suggested FAQ */}
                      {suggestedFaq && (
                        <div className="bg-muted/30 rounded-md p-3">
                          <div className="flex items-start gap-2">
                            <Lightbulb size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-muted-foreground mb-1">Suggested FAQ</div>
                              <p className="text-sm font-medium text-foreground">"{suggestedFaq.question}"</p>
                              {isExpanded && suggestedFaq.answer_guidance && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                  <span className="font-medium">A: </span>{suggestedFaq.answer_guidance}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Expanded Details */}
                      {isExpanded && analysis && (
                        <>
                          <div className="border-t border-border/50 pt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <BarChart3 size={16} className="text-muted-foreground" />
                              <span className="text-sm font-medium">Analysis Details</span>
                            </div>
                            <div className="bg-muted/20 rounded-md overflow-hidden">
                              <table className="w-full text-sm">
                                <tbody>
                                  <tr className="border-b border-border/30">
                                    <td className="py-2 px-3 text-muted-foreground font-medium w-[140px]">Gap Category</td>
                                    <td className="py-2 px-3 capitalize">{category}</td>
                                  </tr>
                                  {analysis.missing_info && (
                                    <tr className="border-b border-border/30">
                                      <td className="py-2 px-3 text-muted-foreground font-medium">Missing Info</td>
                                      <td className="py-2 px-3">{analysis.missing_info}</td>
                                    </tr>
                                  )}
                                  {analysis.priority_reason && (
                                    <tr>
                                      <td className="py-2 px-3 text-muted-foreground font-medium">Priority Reason</td>
                                      <td className="py-2 px-3">{analysis.priority_reason}</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          
                          {/* Search Context */}
                          {analysis.search_topics && analysis.search_topics.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Search size={14} className="text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Search Context</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Topics: {analysis.search_topics.join(", ")}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Card Footer - Actions */}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        {!item.resolved && suggestedFaq && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 text-sm gap-1.5"
                            onClick={() => {
                              setKgAddFaqItem(item);
                              form.setValue("question", suggestedFaq.question);
                              form.setValue("answer", suggestedFaq.answer_guidance);
                              form.setValue("topic", category.charAt(0).toUpperCase() + category.slice(1));
                              setIsAddDialogOpen(true);
                            }}
                            data-testid={`button-add-faq-${item._id}`}
                          >
                            <Plus size={14} /> Add FAQ
                          </Button>
                        )}
                        {!item.resolved && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-8 text-sm gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                            onClick={() => {
                              setResolveItemId(item._id);
                              setIsResolveDialogOpen(true);
                            }}
                            data-testid={`button-resolve-${item._id}`}
                          >
                            <Check size={14} /> Resolve
                          </Button>
                        )}
                        {item.resolved && (
                          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 font-medium"
                        onClick={toggleExpanded}
                        data-testid={`button-toggle-details-${item._id}`}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={14} /> Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} /> View Details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Resolve Dialog */}
          <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Resolve Knowledge Gap</DialogTitle>
                <DialogDescription>
                  Mark this question as resolved. Optionally add notes about how it was addressed.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea 
                  placeholder="Resolution notes (optional)... e.g., 'Added FAQ about gift wrapping'"
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="input-resolve-notes"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => resolveItemId && resolveKnowledgeGapMutation.mutate({ id: resolveItemId, notes: resolveNotes })}
                  disabled={resolveKnowledgeGapMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-confirm-resolve"
                >
                  {resolveKnowledgeGapMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Resolving...</>
                  ) : (
                    <><Check size={16} className="mr-2" /> Mark Resolved</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Website Sources Tab */}
        <TabsContent value="websites" className="space-y-6">
          {/* Error Indicator Banner */}
          {errorStats && errorStats.recentCritical > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3" data-testid="banner-error-indicator">
              <AlertCircle size={20} className="text-destructive shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  {errorStats.recentCritical} error{errorStats.recentCritical > 1 ? 's' : ''} in the last 24 hours
                </p>
                <p className="text-xs text-muted-foreground">
                  Some operations may have failed. Check your scraping results and retry if needed.
                </p>
              </div>
            </div>
          )}
          
          {/* Document Upload Section */}
          <div className="bg-card p-6 rounded-lg border border-border/50 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileUp size={20} className="text-primary" />
                  Upload Documents
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload PDF, DOCX, or TXT files to add to your knowledge base. Documents are automatically parsed and indexed for RAG search.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <input
                  type="file"
                  ref={docFileInputRef}
                  onChange={handleDocUpload}
                  accept=".pdf,.docx,.txt"
                  multiple
                  className="hidden"
                />
                <Button
                  onClick={() => docFileInputRef.current?.click()}
                  disabled={uploadDocMutation.isPending || batchUploadMutation.isPending}
                  style={{ backgroundColor: "hsl(var(--primary))" }}
                  className="text-white"
                >
                  {uploadDocMutation.isPending || batchUploadMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      {batchUploadMutation.isPending ? `Uploading${uploadProgress ? ` (${uploadProgress.current}/${uploadProgress.total})` : "..."}` : "Uploading..."}
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Upload Documents
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
            >
              <FileUp size={32} className={`mx-auto mb-3 ${isDragOver ? "text-primary" : "text-muted-foreground/50"}`} />
              <p className={`text-sm font-medium ${isDragOver ? "text-primary" : "text-muted-foreground"}`}>
                {isDragOver ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOCX, TXT &middot; Max 10MB per file &middot; Up to 20 files at once
              </p>
            </div>

            {/* Documents Table */}
            {documents.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead className="w-[80px]">Size</TableHead>
                      <TableHead className="w-[80px]">Chunks</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[120px]">Uploaded</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[300px]">{doc.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-[10px]">
                            {doc.fileType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatFileSize(doc.fileSize)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{doc.chunkCount}</Badge>
                        </TableCell>
                        <TableCell>
                          {doc.status === "ready" && (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                              Ready
                            </Badge>
                          )}
                          {doc.status === "processing" && (
                            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                              <Loader2 size={10} className="mr-1 animate-spin" />
                              Processing
                            </Badge>
                          )}
                          {doc.status === "failed" && (
                            <Badge variant="destructive" title={doc.errorMessage || "Processing failed"}>
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Delete "${doc.fileName}"?`)) {
                                deleteDocMutation.mutate(doc.id);
                              }
                            }}
                            disabled={deleteDocMutation.isPending}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              !loadingDocuments && (
                <div className="text-center py-8 text-muted-foreground text-sm border rounded-md border-dashed">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  No documents uploaded yet. Upload a PDF, DOCX, or TXT file to get started.
                </div>
              )
            )}
          </div>

          {/* Primary Scrape Website Section */}
          <div className="bg-card p-6 rounded-lg border border-border/50 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap size={20} className="text-primary" />
                  Scrape Your Website
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically crawl your website to train your bot. Prioritizes important pages like About, FAQ, Shipping, and Returns.
                </p>
              </div>
              
              {/* Store URL Field */}
              <div className="shrink-0 min-w-[320px]">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Store URL</label>
                {isEditingStoreUrl ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center">
                        <span className="text-sm text-muted-foreground bg-muted px-2 py-1.5 rounded-l-md border border-r-0 border-border whitespace-nowrap">
                          https://
                        </span>
                        <Input
                          value={storeUrlInput}
                          onChange={(e) => {
                            setStoreUrlInput(e.target.value);
                            setStoreUrlError("");
                          }}
                          placeholder="yourstore.com"
                          className="rounded-l-none h-8 flex-1"
                          data-testid="input-store-url"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveStoreUrl();
                            if (e.key === "Escape") handleCancelEditingUrl();
                          }}
                          autoFocus
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSaveStoreUrl}
                        disabled={updateWebsiteUrlMutation.isPending || !storeUrlInput.trim()}
                        style={{ backgroundColor: "hsl(var(--primary))" }}
                        className="text-white h-8 px-2"
                        data-testid="button-save-store-url"
                      >
                        {updateWebsiteUrlMutation.isPending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEditingUrl}
                        className="h-8 px-2"
                        data-testid="button-cancel-store-url"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                    {storeUrlError && (
                      <p className="text-xs text-destructive">{storeUrlError}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {clientWebsiteUrl ? (
                      <>
                        <div className="flex-1 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border border-border truncate">
                          {clientWebsiteUrl}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleStartEditingUrl}
                          className="h-8 px-2 hover:bg-muted"
                          data-testid="button-edit-store-url"
                        >
                          <Pencil size={14} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 text-sm text-muted-foreground/70 italic bg-muted/30 px-3 py-1.5 rounded-md border border-dashed border-border">
                          No URL configured
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setStoreUrlInput("");
                            setIsEditingStoreUrl(true);
                          }}
                          className="h-8 px-3 text-xs"
                          data-testid="button-add-store-url"
                        >
                          <Plus size={12} className="mr-1" />
                          Add URL
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {clientWebsiteUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                  <Globe size={18} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium flex-1 truncate">{clientWebsiteUrl}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Pages:</span>
                    <Input
                      type="number"
                      value={maxPages}
                      onChange={(e) => setMaxPages(parseInt(e.target.value) || 10)}
                      className="w-20 h-8"
                      min={1}
                      max={50}
                      data-testid="input-default-max-pages"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => crawlMutation.mutate({ url: clientWebsiteUrl, maxPages })}
                  disabled={crawlMutation.isPending}
                  style={{ backgroundColor: "hsl(var(--primary))" }}
                  className="text-white w-full h-11"
                  data-testid="button-scrape-default-website"
                >
                  {crawlMutation.isPending ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Scraping Website...
                    </>
                  ) : (
                    <>
                      <Zap size={18} className="mr-2" />
                      Scrape Website ({maxPages} pages)
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Crawls key pages: Home, Collections, Products, About, FAQ, Shipping, Returns, and Policies
                </p>
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-border text-center">
                <Globe size={24} className="mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Add your Store URL above to enable one-click website scraping.
                </p>
              </div>
            )}
          </div>

          {/* Collapsible Additional Scraping Section */}
          <div className="bg-card rounded-lg border border-border/50 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowAdditionalScrape(!showAdditionalScrape)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              data-testid="button-toggle-additional-scrape"
            >
              <div className="flex items-center gap-2">
                {showAdditionalScrape ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <span className="font-medium">Scrape Additional Pages</span>
              </div>
              <span className="text-sm text-muted-foreground">Custom URLs & individual pages</span>
            </button>
            
            {showAdditionalScrape && (
              <div className="p-4 pt-0 border-t border-border/50">
                <div className="flex gap-2 mb-4 mt-4">
                  <Button
                    variant={scrapeMode === "single" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setScrapeMode("single")}
                    data-testid="button-mode-single"
                  >
                    <Link size={14} className="mr-1.5" />
                    Single Page
                  </Button>
                  <Button
                    variant={scrapeMode === "crawl" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setScrapeMode("crawl")}
                    data-testid="button-mode-crawl"
                  >
                    <Globe size={14} className="mr-1.5" />
                    Crawl Website
                  </Button>
                </div>

                {scrapeMode === "single" ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/page"
                      value={scrapeUrlInput}
                      onChange={(e) => setScrapeUrlInput(e.target.value)}
                      className="flex-1"
                      data-testid="input-scrape-url"
                    />
                    <Button
                      onClick={() => scrapeMutation.mutate(scrapeUrlInput)}
                      disabled={scrapeMutation.isPending || !scrapeUrlInput.trim()}
                      style={{ backgroundColor: "hsl(var(--primary))" }}
                      className="text-white"
                      data-testid="button-scrape"
                    >
                      {scrapeMutation.isPending ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Scraping...
                        </>
                      ) : (
                        <>
                          <Plus size={16} className="mr-2" />
                          Scrape Page
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com"
                        value={crawlUrlInput}
                        onChange={(e) => setCrawlUrlInput(e.target.value)}
                        className="flex-1"
                        data-testid="input-crawl-url"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">Max pages:</span>
                        <Input
                          type="number"
                          value={maxPages}
                          onChange={(e) => setMaxPages(parseInt(e.target.value) || 10)}
                          className="w-20"
                          min={1}
                          max={50}
                          data-testid="input-max-pages"
                        />
                      </div>
                      <Button
                        onClick={() => crawlMutation.mutate({ url: crawlUrlInput, maxPages })}
                        disabled={crawlMutation.isPending || !crawlUrlInput.trim()}
                        style={{ backgroundColor: "hsl(var(--primary))" }}
                        className="text-white"
                        data-testid="button-crawl"
                      >
                        {crawlMutation.isPending ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Crawling...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={16} className="mr-2" />
                            Crawl Website
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Crawling will automatically discover and scrape up to {maxPages} pages from the website.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scraped URLs List */}
          <div className="bg-card rounded-lg border border-border/50 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-semibold">Scraped Pages ({scrapedUrls.length})</h3>
              {scrapedUrls.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Refresh all ${scrapedUrls.length} pages? This will use ${scrapedUrls.length} Firecrawl credits.`)) {
                      rescrapeAllMutation.mutate();
                    }
                  }}
                  disabled={rescrapeAllMutation.isPending || rescrapeMutation.isPending}
                  data-testid="button-refresh-all-scraped"
                >
                  {rescrapeAllMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="mr-1.5 animate-spin" />
                      Refreshing All...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} className="mr-1.5" />
                      Refresh All
                    </>
                  )}
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[40%]">Page Title</TableHead>
                  <TableHead className="w-[30%]">URL</TableHead>
                  <TableHead className="w-[10%] text-center">Chunks</TableHead>
                  <TableHead className="w-[15%]">Scraped</TableHead>
                  <TableHead className="w-[5%] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingScrapedUrls ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <Loader2 size={20} className="animate-spin inline mr-2" />
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : scrapedUrls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Globe size={32} className="text-muted-foreground/50" />
                        <p>No pages scraped yet</p>
                        <p className="text-xs">Add a URL above to start training your bot with website content</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  scrapedUrls.map((item: ScrapedUrl) => (
                    <TableRow key={item.source_url} data-testid={`row-scraped-${encodeURIComponent(item.source_url)}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Globe size={14} className="text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[300px]">{item.page_title || "Untitled"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={item.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                        >
                          {new URL(item.source_url).pathname || "/"}
                          <ExternalLink size={12} />
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.chunk_count}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.scraped_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            onClick={() => rescrapeMutation.mutate(item.source_url)}
                            disabled={rescrapingUrl === item.source_url || rescrapeAllMutation.isPending}
                            title="Refresh this page"
                            data-testid={`button-refresh-scraped-${encodeURIComponent(item.source_url)}`}
                          >
                            {rescrapingUrl === item.source_url ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <RefreshCw size={14} />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm(`Delete scraped content from "${item.page_title || item.source_url}"?`)) {
                                deleteScrapedMutation.mutate(item.source_url);
                              }
                            }}
                            disabled={rescrapingUrl === item.source_url || rescrapeAllMutation.isPending}
                            data-testid={`button-delete-scraped-${encodeURIComponent(item.source_url)}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
