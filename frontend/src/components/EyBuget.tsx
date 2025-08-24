import { TreeDeciduous } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface SearchResult {
  results: string[];
}

interface BudgetAdviceData {
  query: string;
  advice: string;
}

interface TrackerData {
  message: string;
  expense_pie: string;
  expense_bar: string;
  earning_pie: string;
  earning_bar: string;
  total_expenditure: number;
  total_earnings: number;
  chat_history_expenses: string[];
  chat_history_earnings: string[];
}

const ExpenseEarningsTracker: React.FC = () => {
  // State for recording status
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeActionType, setActiveActionType] = useState<string | null>(null);

  // State for transaction data
  const [message, setMessage] = useState<string>("");
  const [expensePie, setExpensePie] = useState<string>("");
  const [expenseBar, setExpenseBar] = useState<string>("");
  const [earningPie, setEarningPie] = useState<string>("");
  const [earningBar, setEarningBar] = useState<string>("");
  const [totalExpenditure, setTotalExpenditure] = useState<number>(0);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);

  // State for chat history
  const [expenseHistory, setExpenseHistory] = useState<string[]>([]);
  const [earningHistory, setEarningHistory] = useState<string[]>([]);
  const [expenseSearchResults, setExpenseSearchResults] = useState<string[]>(
    []
  );
  const [earningSearchResults, setEarningSearchResults] = useState<string[]>(
    []
  );

  // State for budget advice
  const [budgetQuery, setBudgetQuery] = useState<string>(
    "Ask something about managing your budget..."
  );
  const [budgetAdvice, setBudgetAdvice] = useState<string>(
    "AI-generated financial guidance will appear here."
  );

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [queryProcessing, setQueryProcessing] = useState<boolean>(false);
  // Refs for media recorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const toggleRecording = async (action: string) => {
    if (!isRecording) {
      await startRecording(action);
    } else {
      stopRecording();
    }
  };

  const startRecording = async (action: string) => {
    try {
      setIsRecording(true);
      setActiveActionType(action);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        sendAudioToServer(audioBlob, action);
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();

      // Stop all tracks from the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
      setQueryProcessing(true);
      setIsRecording(false);
      setActiveActionType(null);
    }
  };

  const sendAudioToServer = (audioBlob: Blob, action: string) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice_input.wav");

    let endpoint = "";

    if (action === "input") {
      endpoint = "http://localhost:5000/budget_upload_audio";
    } else if (action === "budget") {
      endpoint = "http://localhost:5000/get_budget_advice";
    } else {
      endpoint = `http://localhost:5000/budget_search_chat?type=${action}`;
    }

    fetch(endpoint, {
      method: "POST",
      body: formData,
      mode: "cors",
    })
      .then((response) => response.json())
      .then((data) => {
        if (action === "input") {
          const trackerData = data as TrackerData;
          setMessage(trackerData.message);
          setExpensePie(trackerData.expense_pie);
          setExpenseBar(trackerData.expense_bar);
          setEarningPie(trackerData.earning_pie);
          setEarningBar(trackerData.earning_bar);
          setTotalExpenditure(trackerData.total_expenditure);
          setTotalEarnings(trackerData.total_earnings);
          setExpenseHistory(trackerData.chat_history_expenses);
          setEarningHistory(trackerData.chat_history_earnings);
          setQueryProcessing(false);
        } else if (action === "budget") {
          setQueryProcessing(false);
          const budgetData = data as BudgetAdviceData;
          setBudgetQuery(`Your Query: ${budgetData.query}`);
          setBudgetAdvice(`AI Advice: ${budgetData.advice}`);
        } else {
          const searchData = data as SearchResult;
          setQueryProcessing(false);
          if (action === "expense") {
            setExpenseSearchResults(searchData.results);
          } else if (action === "earning") {
            setEarningSearchResults(searchData.results);
          }
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-black via-gray-900 to-[#fccd03]/30">
      <Header />

      <div className="flex flex-1 py-20">
        <Sidebar activePage="budget-assistant" />

        {/* Content Area */}
        <div className="ml-64 flex-1 p-8 flex gap-8">
          {/* Main Content */}
          <div className="flex-[2] flex flex-col items-center overflow-y-auto space-y-12">
            <div className="w-full bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 p-10 rounded-3xl shadow-2xl backdrop-blur-lg border-2 border-[#fccd03]/40 hover:border-[#fccd03]/60 transition-all duration-300">
              <div className="flex gap-8">
                {/* Left side - Mic button */}
                <div className="flex flex-col items-center">
                  <h2 className="text-[#fccd03] text-2xl mb-6 font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fccd03] to-[#e3b902]">
                    Record Your Transaction
                  </h2>

                  <button
                    className={`group flex items-center justify-center w-24 h-24 ${
                      isRecording
                        ? "bg-gradient-to-r from-red-600 to-red-700"
                        : "bg-gradient-to-r from-[#fccd03] to-[#e3b902]"
                    } text-gray-900 rounded-full cursor-pointer text-3xl font-bold transition-all duration-300 hover:from-[#e3b902] hover:to-[#fccd03] shadow-[0_0_30px_rgba(252,205,3,0.4)] hover:shadow-[0_0_40px_rgba(252,205,3,0.6)] hover:scale-110 active:scale-95 hover:rotate-12`}
                    onClick={() => toggleRecording("input")}
                  >
                    <span className="text-4xl">🎤</span>
                  </button>

                  <p className="text-center mt-4 text-[#fccd03] text-xl font-medium">
                    {message}
                  </p>
                </div>

                {/* Right side - Expenses and Earnings in parallel */}
                <div className="flex-1 flex gap-8">
                  {/* Expenses Section */}
                  <div className="flex-1">
                    <h2 className="text-center text-[#fccd03] text-3xl mb-8 font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fccd03] to-[#e3b902]">
                      Expenses
                    </h2>
                    {/* <div className="flex flex-col gap-6 mb-6">
                      {expensePie && (
                        <img
                          src={`data:image/png;base64,${expensePie}`}
                          alt="Expense Pie Chart"
                          className="w-full rounded-2xl border-2 border-[#fccd03]/40 shadow-xl hover:shadow-[#fccd03]/30 hover:scale-105 transition-all duration-300"
                        />
                      )}
                      {expenseBar && (
                        <img
                          src={`data:image/png;base64,${expenseBar}`}
                          alt="Expense Bar Chart"
                          className="w-full rounded-2xl border-2 border-[#fccd03]/40 shadow-xl hover:shadow-[#fccd03]/30 hover:scale-105 transition-all duration-300"
                        />
                      )}
                    </div> */}
                    <h3 className="text-center text-[#fccd03] text-2xl font-bold">
                      Total Expenditure: ₹{totalExpenditure}
                    </h3>
                  </div>

                  {/* Earnings Section */}
                  <div className="flex-1">
                    <h2 className="text-center text-[#fccd03] text-3xl mb-8 font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fccd03] to-[#e3b902]">
                      Earnings
                    </h2>
                    {/* <div className="flex flex-col gap-6 mb-6">
                      {earningPie && (
                        <img
                          src={`data:image/png;base64,${earningPie}`}
                          alt="Earnings Pie Chart"
                          className="w-full rounded-2xl border-2 border-[#fccd03]/40 shadow-xl hover:shadow-[#fccd03]/30 hover:scale-105 transition-all duration-300"
                        />
                      )}
                      {earningBar && (
                        <img
                          src={`data:image/png;base64,${earningBar}`}
                          alt="Earnings Bar Chart"
                          className="w-full rounded-2xl border-2 border-[#fccd03]/40 shadow-xl hover:shadow-[#fccd03]/30 hover:scale-105 transition-all duration-300"
                        />
                      )}
                    </div> */}
                    <h3 className="text-center text-[#fccd03] text-2xl font-bold">
                      Total Earnings: ₹{totalEarnings}
                    </h3>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-center text-[#fccd03] text-3xl mb-8 font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fccd03] to-[#e3b902]">
                      Net
                    </h2>
                    {/* <div className="flex flex-col gap-6 mb-6">
                      {earningPie && (
                        <img
                          src={`data:image/png;base64,${earningPie}`}
                          alt="Earnings Pie Chart"
                          className="w-full rounded-2xl border-2 border-[#fccd03]/40 shadow-xl hover:shadow-[#fccd03]/30 hover:scale-105 transition-all duration-300"
                        />
                      )}
                      {earningBar && (
                        <img
                          src={`data:image/png;base64,${earningBar}`}
                          alt="Earnings Bar Chart"
                          className="w-full rounded-2xl border-2 border-[#fccd03]/40 shadow-xl hover:shadow-[#fccd03]/30 hover:scale-105 transition-all duration-300"
                        />
                      )}
                    </div> */}
                    <h3 className="text-center text-[#fccd03] text-2xl font-bold">
                      Profit/Loss: <span className={totalEarnings - totalExpenditure >= 0 ? "text-green" : "text-red"}> ₹{totalEarnings - totalExpenditure}</span>
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="w-full bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 p-8 rounded-3xl shadow-2xl backdrop-blur-lg border-2 border-[#fccd03]/40 hover:border-[#fccd03]/60 transition-all duration-300 transform hover:scale-[1.02]">
              <h2 className="text-center text-[#fccd03] text-3xl mb-8 font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fccd03] to-[#e3b902]">
                Is there anything I can help you with managing your budgets?
              </h2>

              <button
                className="group flex items-center justify-center mx-auto w-24 h-24 bg-gradient-to-r from-[#fccd03] to-[#e3b902] text-gray-900 rounded-full cursor-pointer text-3xl font-bold transition-all duration-300 hover:from-[#e3b902] hover:to-[#fccd03] mb-8 shadow-[0_0_30px_rgba(252,205,3,0.4)] hover:shadow-[0_0_40px_rgba(252,205,3,0.6)] hover:scale-110 active:scale-95 hover:rotate-12"
                onClick={() => toggleRecording("budget")}
              >
                <span className="text-4xl">🎤</span>
              </button>

              <div className="border-2 border-[#fccd03]/40 p-8 rounded-2xl bg-gray-800/60 text-center backdrop-blur-lg shadow-2xl hover:shadow-[#fccd03]/20 hover:border-[#fccd03]/60 transition-all duration-300 transform hover:scale-[1.02]">
                <h3 className="text-[#fccd03] text-2xl mb-6 font-bold">
                  AI Recommendations:
                </h3>
                <p className="mb-4 text-[#fccd03]/90 text-lg italic">
                  {budgetQuery}
                </p>
                <p className="text-[#fccd03]/90 text-lg italic">
                  {budgetAdvice}
                </p>
              </div>
            </div> */}
            <div className="w-full bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 p-8 rounded-3xl shadow-2xl backdrop-blur-lg border-2 border-[#fccd03]/40 hover:border-[#fccd03]/60 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex flex-row gap-6 mb-6">
                {expensePie && (
                  <img
                    src={`data:image/png;base64,${expensePie}`}
                    alt="Expense Pie Chart"
                    className="h-[420px] w-[520px] rounded-2xl border-2 border-[#fccd03]/40 shadow-xl hover:shadow-[#fccd03]/30 hover:scale-105 transition-all duration-300"
                  />
                )}
                {expenseBar && (
                  <img
                    src={`data:image/png;base64,${expenseBar}`}
                    alt="Expense Bar Chart"
                    className="h-[420px] w-[520px] rounded-2xl border-2 border-[#fccd03]/40 shadow-xl hover:shadow-[#fccd03]/30 hover:scale-105 transition-all duration-300"
                  />
                )}
              </div>
              <div className="flex flex-row gap-6 mb-6">
                {earningPie && (
                  <img
                    src={`data:image/png;base64,${earningPie}`}
                    alt="Earnings Pie Chart"
                    className="h-[420px] w-[520px] rounded-2xl border-2 border-[#fccd03]/40 shadow-xl hover:shadow-[#fccd03]/30 hover:scale-105 transition-all duration-300"
                  />
                )}
                {earningBar && (
                  <img
                    src={`data:image/png;base64,${earningBar}`}
                    alt="Earnings Bar Chart"
                    className="h-[420px] w-[520px] rounded-2xl border-2 border-[#fccd03]/40 shadow-xl hover:shadow-[#fccd03]/30 hover:scale-105 transition-all duration-300"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Chat History Sidebar */}
          <div className="flex-1 flex flex-col gap-8">
            {/* Expense Chat History */}
            <div className="bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 p-8 rounded-3xl shadow-2xl backdrop-blur-lg border-2 border-[#fccd03]/40 hover:border-[#fccd03]/60 transition-all duration-300 transform hover:scale-[1.02]">
              <h3 className="text-center text-[#fccd03] text-2xl mb-6 font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fccd03] to-[#e3b902]">
                Expense Chat History
              </h3>
              <div className="flex justify-center mb-6">
                <button
                  className="w-20 h-20 bg-gradient-to-r from-[#fccd03] to-[#e3b902] text-gray-900 rounded-full text-2xl font-bold transition-all duration-300 hover:from-[#e3b902] hover:to-[#fccd03] flex items-center justify-center shadow-[0_0_30px_rgba(252,205,3,0.4)] hover:shadow-[0_0_40px_rgba(252,205,3,0.6)] hover:scale-110 active:scale-95 hover:rotate-12"
                  onClick={() => toggleRecording("expense")}
                >
                  🎤
                </button>
              </div>
              <div className="max-h-[40vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-[#fccd03] scrollbar-track-gray-800/60">
                <ul className="space-y-3">
                  {expenseHistory.map((entry, budget_index) => (
                    <li
                      key={`expense-${budget_index}`}
                      className="bg-gray-800/60 p-4 rounded-xl border-2 border-[#fccd03]/40 text-[#fccd03] text-sm backdrop-blur-lg shadow-lg hover:shadow-[#fccd03]/25 hover:border-[#fccd03]/60 hover:scale-[1.02] transition-all duration-300"
                    >
                      {entry}
                    </li>
                  ))}
                  {expenseSearchResults.map((result, budget_index) => (
                    <li
                      key={`expense-search-${budget_index}`}
                      className="bg-gray-800/60 p-4 rounded-xl border-2 border-[#fccd03]/40 text-[#fccd03] text-sm backdrop-blur-lg shadow-lg hover:shadow-[#fccd03]/25 hover:border-[#fccd03]/60 hover:scale-[1.02] transition-all duration-300"
                    >
                      {result}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Earnings Chat History */}
            <div className="bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 p-8 rounded-3xl shadow-2xl backdrop-blur-lg border-2 border-[#fccd03]/40 hover:border-[#fccd03]/60 transition-all duration-300 transform hover:scale-[1.02]">
              <h3 className="text-center text-[#fccd03] text-2xl mb-6 font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fccd03] to-[#e3b902]">
                Earnings Chat History
              </h3>
              <div className="flex justify-center mb-6">
                <button
                  className="w-20 h-20 bg-gradient-to-r from-[#fccd03] to-[#e3b902] text-gray-900 rounded-full text-2xl font-bold transition-all duration-300 hover:from-[#e3b902] hover:to-[#fccd03] flex items-center justify-center shadow-[0_0_30px_rgba(252,205,3,0.4)] hover:shadow-[0_0_40px_rgba(252,205,3,0.6)] hover:scale-110 active:scale-95 hover:rotate-12"
                  onClick={() => toggleRecording("earning")}
                >
                  🎤
                </button>
              </div>
              <div className="max-h-[40vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-[#fccd03] scrollbar-track-gray-800/60">
                <ul className="space-y-3">
                  {earningHistory.map((entry, budget_index) => (
                    <li
                      key={`earning-${budget_index}`}
                      className="bg-gray-800/60 p-4 rounded-xl border-2 border-[#fccd03]/40 text-[#fccd03] text-sm backdrop-blur-lg shadow-lg hover:shadow-[#fccd03]/25 hover:border-[#fccd03]/60 hover:scale-[1.02] transition-all duration-300"
                    >
                      {entry}
                    </li>
                  ))}
                  {earningSearchResults.map((result, budget_index) => (
                    <li
                      key={`earning-search-${budget_index}`}
                      className="bg-gray-800/60 p-4 rounded-xl border-2 border-[#fccd03]/40 text-[#fccd03] text-sm backdrop-blur-lg shadow-lg hover:shadow-[#fccd03]/25 hover:border-[#fccd03]/60 hover:scale-[1.02] transition-all duration-300"
                    >
                      {result}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      {/* Chat Bot Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-8 right-8 bg-[#fccd03] text-black p-4 rounded-full shadow-lg hover:bg-[#e6b800] transition-all duration-300 z-50"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>

      {/* Chat Bot Modal */}
      <div
        className={`fixed bottom-24 right-8 w-[600px] h-[700px] bg-black rounded-lg shadow-2xl border border-white/10 z-50 transition-all duration-300 ease-in-out transform ${
          isChatOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-[#fccd03] font-bold">
              Is there anything I can help you with managing your budgets?
            </h3>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Messages will go here */}
            <p className="bg-[#fccd03] text-black mt-4 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:translate-x-2">
              {budgetQuery}
            </p>
            {queryProcessing && (
              <div className="mx-auto my-4 w-8 h-8 border-4 border-[#fccd03] border-t-[#e3b902] rounded-full animate-spin"></div>
            )}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-2 mt-6 text-white transition-all duration-300 hover:shadow-2xl hover:shadow-[#fccd03]/20 hover:scale-[1.02] hover:-translate-y-1 active:scale-95">
              {/* <h2 className="text-3xl font-bold text-[#fccd03] mb-6 transition-transform duration-300 hover:translate-x-2">Response</h2> */}

              <div className="bg-black/30 rounded-lg p-8 mb-8 min-h-[300px] font-medium text-lg leading-relaxed transition-all duration-300 hover:bg-black/40">
                {budgetAdvice && budgetAdvice.startsWith("AI Advice:") ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-[#fccd03]">AI Advice:</h3>
                    <div className="whitespace-pre-line">
                      {budgetAdvice.replace("AI Advice:", "").replace(/\*\*/g, "").split("\n").map((line, budget_index) => {
                        // Handle Financial Analysis and Recommendations headers
                        if (line.trim().endsWith(":")) {
                          return <h4 key={budget_index} className="font-bold text-[#fccd03] text-xl mt-4 mb-2">{line.trim()}</h4>;
                        }
                        // Handle bullet points
                        else if (line.trim().startsWith("*")) {
                          const parts = line.replace("*", "").trim().split(":");
                          if (parts.length > 1) {
                            return (
                              <div key={budget_index} className="flex ml-4 mb-2">
                                <span className="text-[#fccd03] mr-2">•</span>
                                <span className="font-semibold mr-2">{parts[0]}:</span>
                                <span>{parts[1]}</span>
                              </div>
                            );
                          } else {
                            return (
                              <div key={budget_index} className="flex ml-4 mb-2">
                                <span className="text-[#fccd03] mr-2">•</span>
                                <span>{parts[0]}</span>
                              </div>
                            );
                          }
                        }
                        // Handle numbered recommendations
                        else if (line.trim().match(/^\d+\./)) {
                          const parts = line.trim().split(":");
                          if (parts.length > 1) {
                            return (
                              <div key={budget_index} className="flex ml-4 mb-2">
                                <span className="text-[#fccd03] mr-2">{parts[0].trim()}:</span>
                                <span>{parts[1].trim()}</span>
                              </div>
                            );
                          } else {
                            return (
                              <div key={budget_index} className="ml-4 mb-2">
                                <span>{line.trim()}</span>
                              </div>
                            );
                          }
                        }
                        // Regular text
                        else {
                          return <div key={budget_index} className="mb-2">{line.trim()}</div>;
                        }
                      })}
                    </div>
                  </div>
                ) : (
                  budgetAdvice
                )}
              </div>

              <div className="flex gap-4">
                {/* {showPlayButton && !isPlayingResponse && (
                    <button
                      onClick={playResponse}
                      className="flex-1 bg-[#fccd03] text-black px-6 py-4 rounded-lg font-semibold hover:bg-[#e3b902] transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl shadow-[#fccd03]/20"
                    >
                      🔊 Play Response
                    </button>
                  )} */}

                {/* {isPlayingResponse && (
                    <button
                      onClick={stopResponse}
                      className="flex-1 bg-red-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl"
                    >
                      ⏹ Stop Response
                    </button>
                  )}

                  <audio ref={responseAudioRef} /> */}
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-white/10 mt-auto">
            <div className="flex flex-wrap gap-2 justify-center items-center">
              {/* {!queryRecording.isRecording ? (
                  <button
                    onClick={() => startRecording('query')}
                    className="bg-[#fccd03] text-black px-3 py-3 rounded-full font-semibold hover:bg-[#e3b902] transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl shadow-[#fccd03]/20"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => stopRecording('query')}
                    className="bg-red-500 text-white px-3 py-3 rounded-full font-semibold hover:bg-red-600 transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl"
                  >
                    ⏹
                  </button>
                )} */}
              <button
                className="group flex items-center justify-center mx-auto w-24 h-24 bg-gradient-to-r from-[#fccd03] to-[#e3b902] text-gray-900 rounded-full cursor-pointer text-3xl font-bold transition-all duration-300 hover:from-[#e3b902] hover:to-[#fccd03] mb-8 shadow-[0_0_30px_rgba(252,205,3,0.4)] hover:shadow-[0_0_40px_rgba(252,205,3,0.6)] hover:scale-110 active:scale-95 hover:rotate-12"
                onClick={() => toggleRecording("budget")}
              >
                <span className="text-4xl">🎤</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseEarningsTracker;
