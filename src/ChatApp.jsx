import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaGlobe, FaChevronDown, FaReact, FaComments } from "react-icons/fa";

const LanguageSwitcher = ({ currentLanguage, onToggle }) => {
  return (
    <div className="text-gray-500 text-sm mb-2 text-left p-2 flex items-center">
      <FaGlobe className="text-blue-500 mr-1" />
      <span>Available in: </span>
      <span className="fade-in-out ml-1">{currentLanguage}</span>
      <FaChevronDown className="ml-auto cursor-pointer text-black" onClick={onToggle} />
    </div>
  );
};

const ChatApp = () => {
  // Mutăm limba curentă în `ChatApp`
  const languages = [
    "English",
    "Romanian",
    "Polish",
    "Czech",
    "Slovak",
    "Hungarian",
    "Bulgarian",
    "Croatian",
    "Slovenian",
    "Serbian",
    "Ukrainian",
  ];
  const [currentLanguage, setCurrentLanguage] = useState(languages[0]);
  let languageIndex = 0;

  useEffect(() => {
    const intervalId = setInterval(() => {
      languageIndex = (languageIndex + 1) % languages.length;
      setCurrentLanguage(languages[languageIndex]);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi, we are available to help you in your own language." },
  ]);
  const [input, setInput] = useState("");
  const [courseData, setCourseData] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([
    { role: "system", content: "Hi, we are available to help you in your own language." },
  ]);
  const messageEndRef = useRef(null);

  useEffect(() => {
    axios.get("/nvq-courses.json").then((response) => {
      setCourseData(response.data);
    });
  }, []);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { role: "user", content: input };
      setMessages((prevMessages) => [...prevMessages, { sender: "user", text: input }]);
      setInput("");

      if (!courseData.courses || courseData.courses.length === 0) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: "Sorry, course data is not available at the moment. Please try again later." },
        ]);
        return;
      }

      const updatedConversation = [
        ...conversationHistory,
        userMessage,
        {
          role: "system",
          content: `You are an assistant providing information about NVQ courses. You can answer in any language. When using a different language, keep the name of the course and the cards CSCS in English. Use the provided course details to answer questions accurately. Keep it very short, don't use many words. Keep it as a friendly dialogue, don't display info as a list. Mention the phone number 
          0333 444 0018 when user needs more information. When it comes to the price, ALWAYS mention the half price upfront and make the calculation. When you mention a course, ALWAYS add the link provided. Here is the context:

          General Info:
          - ${courseData.general?.no_college || ""}
          - ${courseData.general?.immediate_enrolment || ""}
          - ${courseData.general?.payment_options || ""}
          - ${courseData.general?.fast_turnaround || ""}
          - ${courseData.general?.one_to_one || ""}
          - ${courseData.general?.account_manager || ""}
          - ${courseData.general?.pass_rate || ""}

          Available Courses:
          ${
            courseData.courses
              ?.map(
                (course, index) => `
                Course ${index + 1}:
                - Name: ${course.course_name}
                - Price: ${course.price}
                - Link: ${course.link}
                `
              )
              .join("") || "No courses available."
          }
          `,
        },
      ];

      const limitedHistory = updatedConversation.slice(-10);

      setConversationHistory(limitedHistory);
      setIsTyping(true);

      try {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4",
            messages: limitedHistory,
          },
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            },
          }
        );

        const botResponse = response.data.choices[0].message.content;
        setMessages((prevMessages) => [...prevMessages, { sender: "bot", text: botResponse }]);
        setConversationHistory((prevHistory) => [...prevHistory, { role: "assistant", content: botResponse }]);
      } catch (error) {
        console.error("Error:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: "Sorry, no one of our assistents is available now." },
        ]);
      }
      setIsTyping(false);
    }
  };

  const transformLinks = (text) => {
    const linkRegex = /(https:\/\/www\.[^\s]+)/g;
    return text.split(linkRegex).map((part, index) => {
      if (linkRegex.test(part)) {
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="mt-0 text-blue-500 underline">
            {part}
          </a>
        );
      }
      return <span key={index} className="block mt-4">{part}</span>;
    });
  };

  return isChatVisible ? (
    <div
      style={{ maxWidth: "450px", height: "550px", wordBreak: "break-word", border: "2px solid lightgrey", background: "linear-gradient(to top, #e0ffff, #ffffff)" }}
      className="bg-white rounded-lg shadow-lg fixed bottom-2 right-2 flex flex-col"
    >
      <LanguageSwitcher currentLanguage={currentLanguage} onToggle={() => setIsChatVisible(false)} />
      <div className="flex-grow p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-2`}>
            <div style={{"max-width":"90%"}} className={`px-4 py-2 rounded-xl text-left ${msg.sender === "user" ? "bg-green-500 text-white text-right" : "bg-gray-100 text-black text-left"}`}>
              {msg.sender === "bot" ? transformLinks(msg.text) : msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start mb-2">
            <div className="px-4 py-2 rounded-xl bg-gray-300 text-black">Typing...</div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>
      <div className="p-2 bg-gray-200 flex items-center border-t border-gray-300">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow border border-gray-300 rounded-lg p-2 mr-2 outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="Type your message..."
        />
        <button onClick={handleSend} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Send</button>
      </div>
    </div>
  ) : (
    <div className="fixed bottom-2 right-2 flex items-center" style={{ margin: "15px" }}>
      <div onClick={() => setIsChatVisible(true)}>
        <div className="ml-2 cursor-pointer p-2 bg-white rounded-lg shadow-lg" style={{ margin: "10px", background: "#f0f8ff" }}>
          Chat with us!
          <br />
          We speak
          <br />
          {currentLanguage}
        </div>
      </div>
      <div onClick={() => setIsChatVisible(true)} style={{ width: "70px", height: "70px", borderRadius: "50%", backgroundColor: "#61DBFB", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", cursor: "pointer" }}>
        <FaComments style={{ color: "#20232a", fontSize: "40px" }} />
      </div>

    </div>
  );
};

export default ChatApp;
