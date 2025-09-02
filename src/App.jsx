import React, { useState, useEffect } from "react";
import { Download, Lock, Unlock, Plus, Search } from "lucide-react";
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
          children: [
            new Paragraph({ children: [new TextRun(generateSummaryContent(includePrivate))] }),
          ],
        },
      ],
    });
    const blob = await Packer.toBlob(wordDoc);
    saveAs(
      blob,
      `${selectedCoachee.name.replace(/ /g, "_")}_Coaching_Summary.docx`
    );
  };

  const filteredResources = Object.entries(resourceHub).flatMap(
    ([category, items]) =>
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
    <div className="p-6 grid grid-cols-4 gap-6 font-sans">
      {/* Sidebar */}
      <div className="col-span-1 space-y-4">
        <h2 className="text-xl font-bold mb-4">Coach Tools</h2>
        {["coachees", "arc", "hub", "admin"].map((mode) => (
          <button
            key={mode}
            className={`block w-full px-3 py-2 rounded ${
              viewMode === mode ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setViewMode(mode)}
          >
            {mode === "coachees"
              ? "Coachee Profiles"
              : mode === "arc"
              ? "Year-Long Arc"
              : mode === "hub"
              ? "Resource Hub"
              : "Admin Dashboard"}
          </button>
        ))}
      </div>

      {/* Main Area */}
      <div className="col-span-3 space-y-6">
        {/* Year-Long Arc */}
        {viewMode === "arc" && selectedMonth && (
          <div className="p-6 border rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-2">{selectedMonth.month}</h2>
            <p className="text-lg text-gray-700 mb-4">{selectedMonth.theme}</p>
            <h3 className="font-semibold mt-4">Tools & Frameworks</h3>
            <ul className="list-disc pl-6">
              {selectedMonth.tools.map((tool, i) => (
                <li key={i}>{tool}</li>
              ))}
            </ul>
            <h3 className="font-semibold mt-4">Resources</h3>
            <ul className="list-disc pl-6">
              {selectedMonth.resources.map((res, i) => (
                <li key={i}>{res}</li>
              ))}
            </ul>
            <h3 className="font-semibold mt-4">Coaching Guidance</h3>
            <p>{selectedMonth.guidance}</p>
          </div>
        )}

        {/* Resource Hub */}
        {viewMode === "hub" && (
          <div className="p-6 border rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Resource Hub</h2>
            <div className="flex items-center mb-4 space-x-2">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search resources..."
                className="flex-1 border p-2 rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {filteredResources.map((res, i) => (
              <div key={i} className="mb-3">
                <p className="font-semibold">{res.item}</p>
                <p className="text-sm text-gray-500">Category: {res.category}</p>
              </div>
            ))}
          </div>
        )}

        {/* Admin Dashboard */}
        {viewMode === "admin" && (
          <div className="p-6 border rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
            {coachees.map((coachee) => {
              const progress = calculateProgress();
              return (
                <div key={coachee.id} className="p-3 border rounded mb-3">
                  <p className="font-semibold">
                    {coachee.name} ({coachee.role})
                  </p>
                  <p className="text-sm text-gray-600">Coach: {coachee.coach}</p>
                  <div className="mt-2 h-2 w-full bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Progress: {progress}% complete
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Coachee Profiles */}
        {viewMode === "coachees" && (
          <div className="p-6 border rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-2">Coachees</h2>
            <div className="flex items-center space-x-2 mb-4">
              <input
                placeholder="Name"
                className="border p-2 rounded"
                value={newCoacheeName}
                onChange={(e) => setNewCoacheeName(e.target.value)}
              />
              <input
                placeholder="Role"
                className="border p-2 rounded"
                value={newCoacheeRole}
                onChange={(e) => setNewCoacheeRole(e.target.value)}
              />
              <button
                onClick={addCoachee}
                className="px-3 py-2 bg-green-600 text-white rounded flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </button>
            </div>
            {coachees.map((coachee) => (
              <div
                key={coachee.id}
                className={`p-3 border rounded mb-2 cursor-pointer ${
                  selectedCoachee && selectedCoachee.id === coachee.id
                    ? "bg-green-100"
                    : ""
                }`}
                onClick={() => setSelectedCoachee(coachee)}
              >
                <span className="font-semibold">{coachee.name}</span>
                <p className="text-sm text-gray-600">{coachee.role}</p>
              </div>
            ))}

            {selectedCoachee && (
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-2">
                  {selectedCoachee.name}
                </h3>
                <p className="text-lg text-gray-700 mb-4">
                  {selectedCoachee.role}
                </p>
                <textarea
                  placeholder="Enter goals..."
                  className="w-full border rounded-lg p-3 mb-3"
                  rows={4}
                  value={documentation["goals"] || ""}
                  onChange={(e) => handleDocChange("goals", e.target.value)}
                />
                <textarea
                  placeholder="Enter session logs..."
                  className="w-full border rounded-lg p-3 mb-3"
                  rows={4}
                  value={documentation["sessionLog"] || ""}
                  onChange={(e) =>
                    handleDocChange("sessionLog", e.target.value)
                  }
                />
                <textarea
                  placeholder="Enter milestones..."
                  className="w-full border rounded-lg p-3 mb-3"
                  rows={4}
                  value={documentation["milestones"] || ""}
                  onChange={(e) =>
                    handleDocChange("milestones", e.target.value)
                  }
                />
                <textarea
                  placeholder="Enter year-end summary..."
                  className="w-full border rounded-lg p-3 mb-3"
                  rows={4}
                  value={documentation["yearSummary"] || ""}
                  onChange={(e) =>
                    handleDocChange("yearSummary", e.target.value)
                  }
                />
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => exportAsPDF(false)}
                    className="px-3 py-2 bg-blue-600 text-white rounded"
                  >
                    Export Shareable PDF
                  </button>
                  <button
                    onClick={() => exportAsWord(false)}
                    className="px-3 py-2 bg-gray-200 rounded"
                  >
                    Export Shareable Word
                  </button>
                  <button
                    onClick={() => exportAsPDF(true)}
                    className="px-3 py-2 bg-red-600 text-white rounded"
                  >
                    Export Full PDF
                  </button>
                  <button
                    onClick={() => exportAsWord(true)}
                    className="px-3 py-2 bg-gray-200 rounded"
                  >
                    Export Full Word
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
Added final App.jsx code
