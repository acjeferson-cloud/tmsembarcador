const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/DeliveryTracking/DeliveryTracking.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix Imports
content = content.replace(
  /import { Search, Package, FileText, Truck, Calendar, CheckCircle, Clock, Box, XCircle } from 'lucide-react';[\s\S]*?interface OrderTrackingData {[\s\S]*?}/,
  `import { Search, Package, FileText, Truck, XCircle } from 'lucide-react';
import { trackingService, OrderTrackingData } from '../../services/trackingService';
import { nfeService } from '../../services/nfeService';
import { ctesCompleteService } from '../../services/ctesCompleteService';
import { supabase } from '../../lib/supabase';
import { useActivityLogger } from '../../hooks/useActivityLogger';
import { UnifiedTrackingTimeline } from '../Shared/UnifiedTrackingTimeline';

type DocumentType = 'order' | 'nfe' | 'cte';
type SearchType = 'number' | 'accessKey';`
);

// 2. Remove buildTimeline, fetchTrackingDataFromDocument, fetchOrderTrackingData
const idxHandleSearch = content.indexOf('  const handleSearch = async () => {');
const idxBuildTimeline = content.indexOf('  const buildTimeline = ');
if (idxBuildTimeline !== -1 && idxHandleSearch !== -1) {
    content = content.slice(0, idxBuildTimeline) + content.slice(idxHandleSearch);
}

// 3. Remove renderTimeline function
const idxRenderTimeline = content.indexOf('  const renderTimeline = (data: OrderTrackingData) => {');
const idxReturnCall = content.indexOf('  return (\n    <div className="p-6 space-y-6">');
if (idxRenderTimeline !== -1 && idxReturnCall !== -1) {
    content = content.slice(0, idxRenderTimeline) + content.slice(idxReturnCall);
}

// 4. Update render call
content = content.replace('{renderTimeline(trackingData)}', '<UnifiedTrackingTimeline trackingData={trackingData} />');

// 5. Remove TimelineItemProps and TimelineItem
content = content.replace(/interface TimelineItemProps \{[\s\S]*?\}\s*const TimelineItem:[\s\S]*/, '');

fs.writeFileSync(filePath, content.trim() + '\n', 'utf-8');
console.log("Patched successfully");
