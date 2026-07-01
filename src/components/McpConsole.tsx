import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Cpu,
  Search,
  Code,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { Property, Lease, Transaction } from '../types';
import McpIntegrations from './McpIntegrations';

interface McpConsoleProps {
  properties: Property[];
  leases: Lease[];
  transactions: Transaction[];
}

export default function McpConsole({ properties, leases, transactions }: McpConsoleProps) {
  const [sandboxQuery, setSandboxQuery] = useState('Show rent receipts from 2026');
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: 'input' | 'system' | 'output'; text: string }>>([
    { type: 'system', text: 'HomeOS MCP Server Initialized.' },
    { type: 'system', text: 'Binding port 3000 -> SSL Handshake Completed.' },
    { type: 'system', text: 'Registered 3 tool endpoints: [query_properties, read_lease_vault, get_financial_ledger].' }
  ]);
  const [schemaExpanded, setSchemaExpanded] = useState(false);

  const executeSandboxCommand = () => {
    if (!sandboxQuery.trim()) return;

    const query = sandboxQuery.toLowerCase().trim();
    const newLogs = [...consoleLogs, { type: 'input', text: `client.execute("${sandboxQuery}")` }];

    // Add a simulated model thinking log
    newLogs.push({
      type: 'system',
      text: `[Gemini LLM] Parsing query. Identified intent: DATA_QUERY. Mapping to MCP tools...`
    });

    let resultsText = '';

    // Execute mock filters based on real state!
    if (query.includes('rent') || query.includes('receipt') || query.includes('paid')) {
      newLogs.push({
        type: 'system',
        text: `[MCP Executing] get_financial_ledger(category="Rent")`
      });
      const rentTx = transactions.filter((t) => t.category === 'Rent');
      resultsText = `Found ${rentTx.length} rent records:\n` +
        rentTx.map((t) => `  - ${t.date} | ${t.propertyName} | ₹${t.amount} [${t.status}]`).join('\n');
    } else if (query.includes('internet') || query.includes('bill')) {
      newLogs.push({
        type: 'system',
        text: `[MCP Executing] get_financial_ledger(category="Internet" or "Electricity" or "Water")`
      });
      const billTx = transactions.filter((t) => t.category !== 'Rent' && t.category !== 'Deposit');
      resultsText = `Found ${billTx.length} utility/repair/maintenance bills:\n` +
        billTx.map((t) => `  - ${t.date} | ${t.category} | ${t.propertyName} | ₹${t.amount} [${t.status}]`).join('\n');
    } else if (query.includes('landlord') || query.includes('owner') || query.includes('phone') || query.includes('contact')) {
      newLogs.push({
        type: 'system',
        text: `[MCP Executing] query_properties(fields=["ownerName", "ownerContact"])`
      });
      resultsText = `Extracted Landlord/Owner Contacts:\n` +
        properties.map((p) => `  - ${p.name}: ${p.ownerName} (${p.ownerContact})`).join('\n');
    } else if (query.includes('lease') || query.includes('clause') || query.includes('agreement')) {
      newLogs.push({
        type: 'system',
        text: `[MCP Executing] read_lease_vault()`
      });
      resultsText = `Active Lease Documents & Version Ledger:\n` +
        leases.map((l) => `  - v${l.version} | ${l.propertyName} | Tenant: ${l.tenantName} | ${l.clauses.length} active clauses`).join('\n');
    } else {
      newLogs.push({
        type: 'system',
        text: `[MCP Executing] query_properties(query="${sandboxQuery}")`
      });
      resultsText = `Found ${properties.length} listing matches in database:\n` +
        properties.map((p) => `  - ${p.name} in ${p.city} | ₹${p.rentAmount}/mo`).join('\n');
    }

    newLogs.push({ type: 'output', text: resultsText });
    setConsoleLogs(newLogs);
  };

  const sampleQueries = [
    'Show rent receipts from 2026',
    'Find landlord phone number',
    'Show internet bills',
    'Read agreement clauses'
  ];

  const mcpToolsSchema = {
    server_identity: "HomeOS Property Lifecycle MCP Server",
    version: "1.2.0",
    tools: [
      {
        name: "query_properties",
        description: "Returns matching residential or commercial properties by city, rent limits, or occupant status.",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string", description: "Filter by city, e.g., Bengaluru." },
            rentAmountMax: { type: "number", description: "Filter by monthly maximum rent limit." }
          }
        }
      },
      {
        name: "read_lease_vault",
        description: "Accesses notary-stamped active lease contracts, signatures, and versioning clauses.",
        parameters: {
          type: "object",
          properties: {
            propertyId: { type: "string" }
          }
        }
      },
      {
        name: "get_financial_ledger",
        description: "Extracts historic transactions, recurring utility bills, and pending tax eligible maintenance fees.",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", enum: ["Rent", "Deposit", "Maintenance", "Electricity", "Water", "Repairs"] }
          }
        }
      }
    ]
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
      
      {/* Left terminal block */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Title bar */}
        <div className="border-b border-[#374151] pb-3">
          <h2 className="text-xl font-extrabold text-white tracking-tight">Developer & MCP Sandbox</h2>
          <p className="text-xs text-[#9CA3AF]">
            Connect HomeOS to ChatGPT, Claude, a custom dashboard, or a WhatsApp / Telegram bot so you can ask about your home anywhere. Test how natural-language questions become structured tool calls below.
          </p>
        </div>

        {/* Input box */}
        <div className="bg-[#111827] border border-[#374151] p-4 rounded-2xl flex flex-col gap-3">
          <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Simulate Natural Language Query</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={sandboxQuery}
              onChange={(e) => setSandboxQuery(e.target.value)}
              className="flex-1 bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold"
              placeholder="e.g. Find landlord phone number..."
            />
            <button
              onClick={executeSandboxCommand}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Execute</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center mt-1">
            <span className="text-[9px] font-bold text-[#9CA3AF] uppercase">Try examples:</span>
            {sampleQueries.map((q) => (
              <button
                key={q}
                onClick={() => setSandboxQuery(q)}
                className="text-[9px] bg-[#1F2937] hover:bg-[#374151] border border-[#374151]/50 text-stone-300 font-bold px-2 py-1 rounded-md transition-all cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Screen */}
        <div className="bg-[#0B1220] border border-[#374151] rounded-2xl overflow-hidden flex flex-col flex-1 shadow-2xl min-h-[350px]">
          {/* Header */}
          <div className="bg-[#111827] border-b border-[#374151] px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Interactive Server Output Console</span>
            </div>
            <button
              onClick={() => setConsoleLogs([{ type: 'system', text: 'Terminal cleared.' }])}
              className="text-[9px] font-bold text-[#9CA3AF] hover:text-white"
            >
              Clear Logs
            </button>
          </div>

          {/* Core Logs Screen */}
          <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto font-mono text-[11px] leading-relaxed scrollbar-thin">
            {consoleLogs.map((log, idx) => (
              <div key={idx} className="flex gap-2">
                {log.type === 'input' && (
                  <>
                    <span className="text-[#8B5CF6] shrink-0 font-bold">❯</span>
                    <span className="text-white font-bold">{log.text}</span>
                  </>
                )}
                {log.type === 'system' && (
                  <>
                    <span className="text-[#2563EB] shrink-0 font-bold">⚙</span>
                    <span className="text-blue-400 font-medium">{log.text}</span>
                  </>
                )}
                {log.type === 'output' && (
                  <pre className="text-[#10B981] font-medium leading-relaxed whitespace-pre-wrap">{log.text}</pre>
                )}
              </div>
            ))}
          </div>
        </div>

      <McpIntegrations />
 </div>

      {/* Right schema definitions block */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
        
        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#2563EB]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">MCP Schema Definition</h4>
          </div>
          <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
            The HomeOS MCP protocol exposes property databases directly to LLM context layers. Explore the tool definitions below:
          </p>

          <button
            onClick={() => setSchemaExpanded(!schemaExpanded)}
            className="w-full py-2 bg-[#1F2937] hover:bg-[#374151] text-white rounded-lg text-[9px] font-bold uppercase cursor-pointer border border-[#374151]"
          >
            {schemaExpanded ? 'Hide JSON Schemas' : 'View JSON Schemas'}
          </button>

          {schemaExpanded && (
            <pre className="bg-[#0B1220] border border-[#374151] p-3 rounded-xl font-mono text-[9px] text-[#10B981] overflow-x-auto max-h-72">
              {JSON.stringify(mcpToolsSchema, null, 2)}
            </pre>
          )}
        </div>

        {/* Security / System facts */}
        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 flex flex-col gap-2.5">
          <span className="text-[10px] font-bold text-[#9CA3AF] uppercase block">Sandboxed Audit Log</span>
          <div className="flex flex-col gap-2 text-[10px] text-[#9CA3AF]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>TLS 1.3 Encryption Active</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>CORS Policy Locked to localhost</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
