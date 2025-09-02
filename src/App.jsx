import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Download, Lock, Unlock, Search, Plus } from "lucide-react";
import jsPDF from "jspdf";
import docx from "docx";
import { saveAs } from "file-saver";

export default function CoachingArcApp() {
  const [arc, setArc] = useState([]);
  const [resourceHub, setResourceHub] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [viewMode, setViewMode] = useState("coachees");
  const [coachees, setCoachees] = useState([]);
  const [selectedCoachee, setSelectedCoachee] = useState(null);
  const [documentation, setDocumentation] = useState({});
  const [privacy, setPrivacy] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [newCoacheeName, setNewCoacheeName] = useState("");
  const [newCoacheeRole, setNewCoacheeRole] = useState("");

  // Load JSON files
  useEffect(() => {
    fetch("/jbs_coaching_arc_demo.json")
      .then((res) => res.json())
      .then((data) => {
        setArc(data);
        setSelectedMonth(data[0]);
      });

    fetch("/jbs_resource_hub_demo.json")
      .then((res) => res.json())
      .then((data) => setResourceHub(data));
  }, []);

  const handleDocChange = (key, value) =>
    setDocumentation({ ...documentation, [key]: value });
  const togglePrivacy = (key) =>
    setPrivacy({ ...privacy, [key]: !privacy[key] });

  const addCoachee = () => {
    if (newCoacheeName.trim() && newCoacheeRole.trim()) {
      const newCoachee = {
        id: Date.now(),
        name: newCoacheeName,
        role: newCoacheeRole,
        coach: "Unassigned",
      };
      setCoachees([...coachees, newCoachee]);
      setSelectedCoachee(newCoachee);
      setNewCoacheeName("");
      setNewCoacheeRole("");
    }
  };

  const generateSummaryContent = (includePrivate = false) => {
    const fields = [
      { key: "goals", label: "Goals" },
      { key: "sessionLog", label: "Session Logs" },
      { key: "milestones", label: "Milestones" },
      { key: "yearSummary", label: "End-of-Year Summary" },
    ];
    return (
      `Coaching Summary for ${selectedCoachee.name} (${selectedCoachee.role})\n\n` +
      fields
        .filter((f) => includePrivate || !privacy[f.key])
        .map((f) => `${f.label}: ${documentation[f.key] || "N/A"}`)
        .join("\n\n")
    );
  };

  const exportAsPDF = (includePrivate = false) => {
    const doc = new jsPDF();
    doc.text(generateSummaryContent(includePrivate), 10, 10);
    doc.save(`${selectedCoachee.name.replace(/ /g, "_")}_Coaching_Summary.pdf`);
  };

  const exportAsWord = async (includePrivate = false) => {
    const { Document, Packer, Paragraph, TextRun } = docx;
    const wordDoc = new Document({
      sections: [
        {
          properties: {},
          children: [new Paragraph({ children: [new TextRun(generateSummaryContent(includePrivate))] })],
        },
      ],
    });
    const blob = await Packer.toBlob(wordDoc);
    saveAs(blob, `${selectedCoachee.name.replace(/ /g, "_")}_Coaching_Summary.docx`);
  };

  const filteredResources = Object.entries(resourceHub).flatMap(([category, items]) =>
    items
      .filter(
        (item) =>
          item.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((item) => ({ category, item }))
  );

  const calculateProgress = () => {
    const fields = ["goals", "sessionLog", "milestones", "yearSummary"];
    const filled = fields.filter((f) => documentation[f]);
    return Math.round((filled.length / fields.length) * 100);
  };

  return (
    <div className="p-6 grid grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="col-span-1 space-y-4">
        <h2 className="text-xl font-bold mb-4">Coach Tools</h2>
        <Button variant={viewMode === "coachees" ? "default" : "outline"} className="w-full" onClick={() => setViewMode("coachees")}>Coachee Profiles</Button>
        <Button variant={viewMode === "arc" ? "default" : "outline"} className="w-full" onClick={() => setViewMode("arc")}>Year-Long Arc</Button>
        <Button variant={viewMode === "hub" ? "default" : "outline"} className="w-full" onClick={() => setViewMode("hub")}>Resource Hub</Button>
        <Button variant={viewMode === "admin" ? "default" : "outline"} className="w-full" onClick={() => setViewMode("admin")}>Admin Dashboard</Button>
      </div>

      {/* Main Area */}
      <div className="col-span-3">
        {/* Year-Long Arc */}
        {viewMode === "arc" && selectedMonth && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-2">{selectedMonth.month}</h2>
            <p className="text-lg text-gray-700 mb-4">{selectedMonth.theme}</p>

            <Tabs defaultValue="tools">
              <TabsList>
                <TabsTrigger value="tools">Tools & Frameworks</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="guidance">Coaching Guidance</TabsTrigger>
              </TabsList>

              <TabsContent value="tools">
                <ul className="list-disc pl-6">
                  {selectedMonth.tools.map((tool, i) => <li key={i}>{tool}</li>)}
                </ul>
              </TabsContent>

              <TabsContent value="resources">
                <ul className="list-disc pl-6">
                  {selectedMonth.resources.map((res, i) => <li key={i}>{res}</li>)}
                </ul>
              </TabsContent>

              <TabsContent value="guidance">
                <p className="text-gray-800 leading-relaxed">{selectedMonth.guidance}</p>
              </TabsContent>
            </Tabs>
          </Card>
        )}

        {/* Resource Hub */}
        {viewMode === "hub" && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Resource Hub</h2>
            <div className="flex items-center mb-4 space-x-2">
              <Search className="w-5 h-5 text-gray-500" />
              <Input placeholder="Search resources..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            {filteredResources.map((res, i) => (
              <div key={i} className="mb-3">
                <p className="font-semibold">{res.item}</p>
                <p className="text-sm text-gray-500">Category: {res.category}</p>
              </div>
            ))}
          </Card>
        )}

        {/* Admin Dashboard */}
        {viewMode === "admin" && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
            <p className="mb-4 text-gray-700">Overview of coaching activity across the team.</p>
            {coachees.map((coachee) => {
              const progress = calculateProgress();
              return (
                <Card key={coachee.id} className="mb-3">
                  <CardContent className="p-3">
                    <p className="font-semibold">{coachee.name} ({coachee.role})</p>
                    <p className="text-sm text-gray-600">Coach: {coachee.coach}</p>
                    <div className="mt-2 h-2 w-full bg-gray-200 rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Progress: {progress}% complete</p>
                    <div className="flex space-x-2 mt-2">
                      <Button size="sm" onClick={() => setSelectedCoachee(coachee) || setViewMode("coachees")}>View Profile</Button>
                      <Button size="sm" variant="outline" onClick={() => exportAsPDF(true)}>Export Full PDF</Button>
                      <Button size="sm" variant="outline" onClick={() => exportAsWord(true)}>Export Full Word</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </Card>
        )}

        {/* Coachee Profiles */}
        {viewMode === "coachees" && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-2">Coachees</h2>

            {/* Add Coachee Form */}
            <div className="flex items-center space-x-2 mb-4">
              <Input placeholder="Name" value={newCoacheeName} onChange={(e) => setNewCoacheeName(e.target.value)} />
              <Input placeholder="Role" value={newCoacheeRole} onChange={(e) => setNewCoacheeRole(e.target.value)} />
              <Button onClick={addCoachee}><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>

            {/* Coachee List */}
            {coachees.map((coachee) => (
              <Card
                key={coachee.id}
                className={`cursor-pointer hover:shadow-md mb-2 ${selectedCoachee && selectedCoachee.id === coachee.id ? "bg-green-100" : ""}`}
                onClick={() => setSelectedCoachee(coachee)}
              >
                <CardContent className="p-3">
                  <span className="font-semibold">{coachee.name}</span>
                  <p className="text-sm text-gray-600">{coachee.role}</p>
                </CardContent>
              </Card>
            ))}

            {/* Selected Coachee Details */}
            {selectedCoachee && (
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-2">{selectedCoachee.name}</h3>
                <p className="text-lg text-gray-700 mb-4">{selectedCoachee.role}</p>

                <div className="mt-2 h-2 w-full bg-gray-200 rounded-full">
                  <div className="h-2 bg-green-500 rounded-full" style={{ width: `${calculateProgress()}%` }}></div>
                </div>
                <p className="text-sm text-gray-500 mb-4">Progress: {calculateProgress()}% complete</p>

                <Tabs defaultValue="goals">
                  <TabsList>
                    <TabsTrigger value="goals">Goals</TabsTrigger>
                    <TabsTrigger value="sessions">Session Logs</TabsTrigger>
                    <TabsTrigger value="milestones">Milestones</TabsTrigger>
                    <TabsTrigger value="summary">Year-End Summary</TabsTrigger>
                  </TabsList>

                  {["goals", "sessionLog", "milestones", "yearSummary"].map((key) => (
                    <TabsContent key={key} value={key === "sessionLog" ? "sessions" : key}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">
                          {key === "sessionLog"
                            ? "Session Logs"
                            : key === "yearSummary"
                            ? "End-of-Year Summary"
                            : key.charAt(0).toUpperCase() + key.slice(1)}
                        </h3>
                        <Button size="sm" variant={privacy[key] ? "destructive" : "outline"} onClick={() => togglePrivacy(key)}>
                          {privacy[key] ? (
                            <>
                              <Lock className="w-4 h-4 mr-1" /> Private
                            </>
                          ) : (
                            <>
                              <Unlock className="w-4 h-4 mr-1" /> Shareable
                            </>
                          )}
                        </Button>
                      </div>
                      <textarea
                        placeholder={`Enter ${key}...`}
                        className="w-full border rounded-lg p-3"
                        rows={5}
                        value={documentation[key] || ""}
                        onChange={(e) => handleDocChange(key, e.target.value)}
                      />
                    </TabsContent>
                  ))}

                  <TabsContent value="summary">
                    <div className="flex items-center space-x-3 mt-3">
                      <Button onClick={() => exportAsPDF(false)}><Download className="w-4 h-4 mr-2" /> Export (Shareable Only PDF)</Button>
                      <Button variant="outline" onClick={() => exportAsWord(false)}><Download className="w-4 h-4 mr-2" /> Export (Shareable Only Word)</Button>
                      <Button variant="outline" onClick={() => exportAsPDF(true)}><Download className="w-4 h-4 mr-2" /> Export (Full PDF)</Button>
                      <Button variant="outline" onClick={() => exportAsWord(true)}><Download className="w-4 h-4 mr-2" /> Export (Full Word)</Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
Added final App.jsx code
