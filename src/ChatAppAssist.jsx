import React, { useState, useEffect } from "react";
import { OpenAI } from "openai";

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [courseData, setCourseData] = useState({});

  // Initialize OpenAI Client
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY, // Accesează cheia din .env
  });

  // Load course data from JSON file
  useEffect(() => {
    fetch("/nvq-courses.json")
      .then((response) => response.json())
      .then((data) => setCourseData(data));
  }, []);

  // Define the assistant with the necessary tools/functions
  const assistantConfig = {
    model: "gpt-4",
    instructions:
      "You are an assistant providing information about NVQ courses. Use the provided functions to answer questions accurately based on the provided course data.",
    tools: [
      {
        type: "function",
        function: {
          name: "getCourseInfo",
          description: "Get details about a specific NVQ course.",
          parameters: {
            type: "object",
            properties: {
              course_name: {
                type: "string",
                description:
                  "The name of the NVQ course, e.g., NVQ Level 2 in Construction",
              },
            },
            required: ["course_name"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "listAllCourses",
          description: "List all available NVQ courses.",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
    ],
  };

  // Helper function to handle function calls
  const handleFunctionCall = (functionName, parameters) => {
    switch (functionName) {
      case "getCourseInfo":
        const course = courseData.courses.find(
          (course) => course.course_name === parameters.course_name
        );
        return course
          ? `Course: ${course.course_name}\nPrice: ${course.price}\nFor: ${course.for_whom}\nLink: ${course.link}\nBenefits: ${course.benefits.join(
              ", "
            )}`
          : "Course not found.";
      case "listAllCourses":
        return `Available Courses:\n${courseData.courses
          .map((course) => `- ${course.course_name}`)
          .join("\n")}`;
      default:
        return "Function not recognized.";
    }
  };

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { sender: "user", text: input };
      setMessages([...messages, userMessage]);
      setInput("");

      try {
        // Create assistant with OpenAI client
        const assistant = await openai.assistants.create({
          model: assistantConfig.model,
          instructions: assistantConfig.instructions,
          tools: assistantConfig.tools,
        });

        // Run assistant to get response based on user input
        const response = await assistant.run({ role: "user", content: input });

        let botResponse = "";
        if (response.function_call) {
          // Handle function calls
          botResponse = handleFunctionCall(
            response.function_call.name,
            JSON.parse(response.function_call.arguments)
          );
        } else {
          botResponse = response.content;
        }

        // Append assistant response to chat
        const botMessage = { sender: "bot", text: botResponse };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#E5DDD5]">
      {/* Chat Container */}
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            } mb-2`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow ${
                msg.sender === "user"
                  ? "bg-[#DCF8C6] text-black rounded-br-none"
                  : "bg-white text-black rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Section */}
      <div className="p-4 bg-[#F0F0F0] flex items-center border-t border-gray-300">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow border border-gray-300 rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-[#34B7F1] placeholder-gray-500"
          placeholder="Type your message..."
        />
        <button
          onClick={handleSend}
          className="bg-[#34B7F1] text-white px-4 py-2 rounded-full hover:bg-[#128C7E] transition duration-300"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatApp;
