import React, { useEffect, useRef, useState } from "react";
import EyMain from "./EyMain";
import InfiniteSlider from "./InfiniteSlider";
import Stack from "./extraComponents/Stack";
import AnimatedList from "./extraComponents/AnimatedList";
import { motion, useAnimation } from "framer-motion";
import SliderYouTube from "./SliderYouTube";
import TimePeriodImageToggle from "./TimePeriodToggle";
import Ragi1 from "../images/1M_Ragi.png";
import Ragi3 from "../images/3M_Ragi.png";
import Ragi6 from "../images/6M_Ragi.png";
import Tomato1 from "../images/1M_Tomato.png";
import Tomato3 from "../images/3M_Tomato.png";
import Tomato6 from "../images/6M_Tomato.png";
import Rice1 from "../images/1M_Rice.png";
import Rice3 from "../images/3M_Rice.jpg";
import Rice6 from "../images/6M_Rice.jpg";
import Wheat1 from "../images/1M_Wheat.jpg";
import Wheat3 from "../images/3M_Wheat.jpg";
import Wheat6 from "../images/6M_Wheat.png";
import NewGraphs from "./NewGraphs";
import StackOld from "./extraComponents/StackOld";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";


interface NewsData {
  news: string;
}

interface GraphData {
  id: string;
  name: string;
}

interface AudioRecordingState {
  isRecording: boolean;
  chunks: Blob[];
  recorder: MediaRecorder | null;
}

interface LiteracyLevel {
  value: "poor" | "good" | "very good" | null;
  label: string;
}
interface KeywordsData {
  keywords: string;
}

const RuralFinancialNews: React.FC = () => {
  const [nameRecording, setNameRecording] = useState<AudioRecordingState>({
    isRecording: false,
    chunks: [],
    recorder: null,
  });
  const [nameStatus, setNameStatus] = useState<string>(
    "Status: Waiting for input..."
  );
  const [nameProcessing, setNameProcessing] = useState<boolean>(false);

  // State for managing query recording
  const [queryRecording, setQueryRecording] = useState<AudioRecordingState>({
    isRecording: false,
    chunks: [],
    recorder: null,
  });
  const [queryStatus, setQueryStatus] = useState<string>("Query: None");
  const [queryProcessing, setQueryProcessing] = useState<boolean>(false);

  // State for literacy level
  const [literacyLevel, setLiteracyLevel] = useState<LiteracyLevel>({
    value: null,
    label: "Status: Literacy level not set.",
  });

  const [news, setNews] = useState<string>("Loading latest news...");
  const [keywords, setKeywords] = useState<string[]>(["Loading keywords..."]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [response, setResponse] = useState<string>(
    "Response will appear here..."
  );
  const [isPlayingResponse, setIsPlayingResponse] = useState<boolean>(false);
  const [detectedLanguageCode, setDetectedLanguageCode] =
    useState<string>("en");
  const [showPlayButton, setShowPlayButton] = useState<boolean>(false);

  const users: User[] = [
    {
      id: "Ragi",
      "1m": Ragi1,
      "3m": Ragi3,
      "6m": Ragi6
    },
    { id: "Tomato",
      "1m": Tomato1, 
      "3m": Tomato3, 
      "6m": Tomato6 
    },
    { id: "Rice", 
      "1m": Rice1, 
      "3m": Rice3, 
      "6m": Rice6 
    },
    { id: "Wheat", 
      "1m": Wheat1, 
      "3m": Wheat3, 
      "6m": Wheat6 
    },
  ];

  const [egnlishItems, setEnglishItems] = useState<EnglishItem[]>([
    {
      id: 1,
      headline: "India Seeks Parliament's Nod for Extra Spending",
      content: "The government is asking for approval to spend an extra 514.63 billion rupees ($5.90 billion) in the current fiscal year, mainly to upgrade telecom networks in underserved areas and fund a new pension scheme for federal employees.",
      publishDate: "Mar 10, 2025"
    },
    {
      id: 2,
      headline: "Dulloo Urges Banks to Strengthen Rural Services",
      content: "At the 15th Union Territory Level Bankers’ Committee meeting in Jammu, Chief Secretary Atal Dulloo called on banks to expand their reach by setting up touchpoints in unbanked rural centers by June, stressing improved KYC compliance to boost local credit access.",
      publishDate: "Mar 10, 2025"
    },
    {
      id: 3,
      headline: "Women’s Day Survey: Rural Women Entrepreneurs Save Diligently",
      content: "A survey by Haqdarshak and DBS Bank India reveals that 90% of rural women entrepreneurs save part of their income, with 33% saving between 20% and 50%. The study highlights evolving financial decision-making in rural households and emphasizes the need for digital banking enhancements.",
      publishDate: "Mar 10, 2025"
    }, {
      id: 4,
      headline: "DAY-NRLM Webinar: Targeting the Last Mile",
      content: "A webinar under the DAY-NRLM banner discussed strategies to reach the last mile in rural areas, emphasizing the role of technology and community networks in ensuring that subsidized credit and benefit transfers reach vulnerable populations.",
      publishDate: "Mar 05, 2025"
    },
    {
      id: 5,
      headline: "Expert Praises Government’s Efforts in Women Empowerment",
      content: "A MIT professor commended recent government initiatives targeting women empowerment in rural India. Enhanced access to financial services and targeted support programs are reportedly shifting traditional decision-making dynamics in rural households.",
      publishDate: "Mar 01, 2025"
    },
    {
      id: 6,
      headline: "Rural India’s Learning Curve: Time Use Survey Findings",
      content: "The latest MoSPI Time Use Survey shows rural residents spent 90 minutes daily on learning activities in 2024, a slight decline from previous years, but still robust compared to urban areas. This data may drive future investments in rural education and digital learning.",
      publishDate: "Mar 04, 2025"
    },
    {
      id: 7,
      headline: "Rural Loan Defaults on the Rise, Warns Private Banks",
      content: "Private banks are witnessing an uptick in defaults on small and personal loans in rural areas due to slower economic growth. Tighter lending rules introduced recently are expected to stabilize asset quality by mid-2025 despite current challenges.",
      publishDate: "Mar 10, 2025"
    },
    {
      id: 8,
      headline: "Budget for Rural Subsidies Remains Steady",
      content: "India’s federal government will maintain a subsidy allocation of 4.57 trillion rupees for food, fertilisers, and rural employment schemes in the next fiscal year, reflecting ongoing support for rural livelihoods amid urban slowdowns.",
      publishDate: "Mar 06, 2025"
    },
    {
      id: 9,
      headline: "Budget Reforms Aim to Boost Household Consumption",
      content: "The new Union Budget introduces income tax cuts for the middle class and boosts spending on agriculture and rural development, aiming to increase disposable income and drive growth in rural areas. Subsidized credit for farmers is also set to be expanded.",
      publishDate: "Mar 06, 2025"
    },
    {
      id: 10,
      headline: "Rural Consumer Spending Drives FMCG Growth",
      content: "NielsenIQ reports a 10.6% sales growth in the FMCG sector driven by strong rural demand, with increased spending on staples like edible oil and wheat flour. Rural markets continue to outperform urban areas, signaling rising consumer power in the countryside.",
      publishDate: "Mar 10, 2025"
    },
  ]);
  const [hindiItems, setHindiItems] = useState<HindiItem[]>([
    {
      id: 1,
      headline: "भारत संसद से अतिरिक्त खर्च की मंजूरी चाहता है",
      content: "सरकार चालू वित्त वर्ष में अतिरिक्त 514.63 अरब रुपये (5.90 अरब डॉलर) खर्च करने की मंजूरी मांग रही है, मुख्य रूप से कम सेवा वाले क्षेत्रों में दूरसंचार नेटवर्क को उन्नत करने और संघीय कर्मचारियों के लिए एक नई पेंशन योजना को निधि देने के लिए।",
      publishDate: "Mar 10, 2025"
    },
    {
      id: 2,
      headline: "डुल्लू ने बैंकों से ग्रामीण सेवाओं को मजबूत करने का आग्रह किया",
      content: "जम्मू में 15वीं केंद्र शासित प्रदेश स्तरीय बैंकर्स समिति की बैठक में, मुख्य सचिव अटल डुल्लू ने बैंकों से जून तक गैर-बैंकिंग ग्रामीण केंद्रों में टचप्वाइंट स्थापित करके अपनी पहुंच का विस्तार करने का आह्वान किया, स्थानीय ऋण पहुंच को बढ़ावा देने के लिए बेहतर केवाईसी अनुपालन पर जोर दिया।",
      publishDate: "Mar 10, 2025"
    },
    {
      id: 3,
      headline: "महिला दिवस सर्वेक्षण: ग्रामीण महिला उद्यमी लगन से बचत करती हैं",
      content: "हकदर्शक और डीबीएस बैंक इंडिया के एक सर्वेक्षण से पता चलता है कि 90% ग्रामीण महिला उद्यमी अपनी आय का कुछ हिस्सा बचाती हैं, जिनमें से 33% 20% से 50% के बीच बचत करती हैं। अध्ययन में ग्रामीण घरों में विकसित हो रहे वित्तीय निर्णय लेने पर प्रकाश डाला गया है और डिजिटल बैंकिंग संवर्द्धन की आवश्यकता पर जोर दिया गया है।",
      publishDate: "Mar 10, 2025"
    }, {
      id: 4,
      headline: "डी ए वाई-एनआरएलएम वेबिनार: अंतिम मील को लक्षित करना",
      content: "डी ए वाई-एनआरएलएम बैनर के तहत एक वेबिनार में ग्रामीण क्षेत्रों में अंतिम मील तक पहुंचने की रणनीतियों पर चर्चा की गई, जिसमें रियायती ऋण और लाभ हस्तांतरण को कमजोर आबादी तक पहुंचाने में प्रौद्योगिकी और सामुदायिक नेटवर्क की भूमिका पर जोर दिया गया।",
      publishDate: "Mar 05, 2025"
    },
    {
      id: 5,
      headline: "विशेषज्ञ ने महिला सशक्तिकरण में सरकार के प्रयासों की सराहना की",
      content: "एम आई टी के एक प्रोफेसर ने ग्रामीण भारत में महिला सशक्तिकरण को लक्षित करने वाली हालिया सरकारी पहलों की सराहना की। कथित तौर पर वित्तीय सेवाओं तक बेहतर पहुंच और लक्षित समर्थन कार्यक्रम ग्रामीण घरों में पारंपरिक निर्णय लेने की गतिशीलता को बदल रहे हैं।",
      publishDate: "Mar 01, 2025"
    },
    {
      id: 6,
      headline: "ग्रामीण भारत का लर्निंग कर्व: टाइम यूज सर्वे के निष्कर्ष",
      content: "नवीनतम एमओएसपीआई टाइम यूज सर्वे से पता चलता है कि ग्रामीण निवासियों ने 2024 में सीखने की गतिविधियों पर प्रतिदिन 90 मिनट बिताए, जो पिछले वर्षों की तुलना में थोड़ी गिरावट है, लेकिन फिर भी शहरी क्षेत्रों की तुलना में मजबूत है। यह डेटा ग्रामीण शिक्षा और डिजिटल सीखने में भविष्य के निवेश को बढ़ावा दे सकता है।",
      publishDate: "Mar 04, 2025"
    },
    {
      id: 7,
      headline: "ग्रामीण ऋण चूक में वृद्धि, निजी बैंकों की चेतावनी",
      content: "निजी बैंक धीमी आर्थिक विकास के कारण ग्रामीण क्षेत्रों में छोटे और व्यक्तिगत ऋणों पर चूक में वृद्धि देख रहे हैं। हाल ही में पेश किए गए सख्त ऋण नियमों से वर्तमान चुनौतियों के बावजूद मध्य 2025 तक संपत्ति की गुणवत्ता स्थिर होने की उम्मीद है।",
      publishDate: "Mar 10, 2025"
    },
    {
      id: 8,
      headline: "ग्रामीण सब्सिडी के लिए बजट स्थिर बना हुआ है",
      content: "भारत की संघीय सरकार अगले वित्तीय वर्ष में भोजन, उर्वरक और ग्रामीण रोजगार योजनाओं के लिए 4.57 ट्रिलियन रुपये का सब्सिडी आवंटन बनाए रखेगी, जो शहरी मंदी के बीच ग्रामीण आजीविका के लिए चल रहे समर्थन को दर्शाता है।",
      publishDate: "Mar 06, 2025"
    },
    {
      id: 9,
      headline: "बजट सुधारों का उद्देश्य घरेलू खपत को बढ़ावा देना है",
      content: "The new Union Budget introduces income tax cuts for the middle class and boosts spending on agriculture and rural development, aiming to increase disposable income and drive growth in rural areas. Subsidized credit for farmers is also set to be expanded.",
      publishDate: "Mar 06, 2025"
    },
    {
      id: 10,
      headline: "ग्रामीण उपभोक्ता खर्च से एफएमसीजी विकास को गति मिली",
      content: "नए केंद्रीय बजट में मध्यम वर्ग के लिए आयकर में कटौती और कृषि और ग्रामीण विकास पर खर्च में वृद्धि की गई है, जिसका उद्देश्य ग्रामीण क्षेत्रों में प्रयोज्य आय को बढ़ाना और विकास को बढ़ावा देना है। किसानों के लिए रियायती ऋण का भी विस्तार किया जाना तय है।",
      publishDate: "Mar 10, 2025"
    },
  ]);

  const controls = useAnimation();
  const [isEnglishNewsHovered, setIsEnglishNewsHovered] = useState(false);

  const items = [
    "Item 1",
    "Item 2",
    "Item 3",
    "Item 4",
    "Item 5",
    "Item 6",
    "Item 7",
    "Item 8",
    "Item 9",
    "Item 10",
  ];

  // Audio reference
  const responseAudioRef = useRef<HTMLAudioElement | null>(null);

  // const english = "english it is";
  // const hindi = "hindi it is";
  // useEffect(() => {
  //   // Fetch news data
  //   fetch("http://127.0.0.1:6484//fetch_news")
  //     .then((response) => response.json())
  //     .then((data: NewsData) => {
  //       if (data.news) {
  //         // Split news and keywords at "5 Key Words"
  //         const [newsContent, keywordsContent] = data.news.split("5 Key Words");

  //         // Set news content with bullet points
  //         const formattedNews = newsContent
  //           .split("*")
  //           .map((point) => point.trim())
  //           .filter((point) => point.length > 0)
  //           .join("\n• ");
  //         setNews("• " + formattedNews);
  //         localStorage.setItem("news", formattedNews);

  //         // Extract and format keywords
  //         const keywordsList = keywordsContent
  //           .split(/\d+\.\s+\*\*/)
  //           .map((keyword) => keyword.trim())
  //           .filter(
  //             (keyword) =>
  //               keyword.length > 0 &&
  //               !keyword.includes("with Short Descriptions:")
  //           );

  //         setKeywords(keywordsList);
  //         localStorage.setItem("keywords", keywordsList.join("\n"));
  //       } else {
  //         // If no data from backend, get from localStorage
  //         const savedNews = localStorage.getItem("news");
  //         const savedKeywords = localStorage.getItem("keywords");

  //         if (savedNews) {
  //           setNews("• " + savedNews);
  //         } else {
  //           setNews("No news available");
  //         }

  //         if (savedKeywords) {
  //           setKeywords(savedKeywords.split("\n"));
  //         } else {
  //           setKeywords(["No keywords available"]);
  //         }
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching news:", error);
  //       // On error, try to get from localStorage
  //       const savedNews = localStorage.getItem("news");
  //       const savedKeywords = localStorage.getItem("keywords");

  //       if (savedNews) {
  //         setNews("• " + savedNews);
  //       } else {
  //         setNews("Failed to load news. Please try again later.");
  //       }

  //       if (savedKeywords) {
  //         setKeywords(savedKeywords.split("\n"));
  //       } else {
  //         setKeywords(["Failed to load keywords. Please try again later."]);
  //       }
  //     });

  // }, []);

  const [youtubeIndex, setYoutubeIndex] = useState<any[]>([]);
  const [keyWords, setKeyWords] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    // Fetch YouTube index data
    fetch("http://127.0.0.1:7863/")
      .then((response) => response.json())
      .then((data) => {
        if (data && Array.isArray(data.yt_index)) {
          setYoutubeIndex(data.yt_index);
        } else if (data && data.yt_index) {
          // If yt_index is not an array, wrap it in an array
          setYoutubeIndex([data.yt_index]);
        } else {
          setYoutubeIndex([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching YouTube index:", error);
        setYoutubeIndex([]);
      });

      fetch("http://localhost:7864/api/get-news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ language: detectedLanguageCode }),
      })
      .then((res) => res.json())
      .then((data) => {
        const raw = data.news_content.agricultural_terms;
        const rawArt = data.news_content.news_article;

        // Extract lines like "1. **Biostimulants**: Substances..."
        const matches = raw.matchAll(/\*\*(.*?)\*\*: (.*?)(?=\n|$)/g);
        const matchesArt = rawArt.matchAll(/\*\*([^*]+)\*\*: ([^\n]+)/g);

        // TypeScript doesn't know the type of 'item' from matchAll, so it infers 'unknown'.
        // You need to assert the type to RegExpMatchArray to access item[1] and item[2] without error.
        const formatted = Array.from(matches, (item) => {
          const match = item as RegExpMatchArray;
          return {
            heading: match[1],
            desc: match[2]
          };
        });

        const formattedArt = Array.from(matchesArt, (m) => ({
          heading: m[1].trim(),
          desc: m[2].trim()
        }));

        console.log("KeyWords:-->", formatted);
        console.log("Articles:-->", formattedArt);

        setKeyWords(formatted);
        setArticles(formattedArt);
      })
      .catch((err) => console.error("Error fetching:", err));
  }, [detectedLanguageCode]);

  const startRecording = async (type: "name" | "query") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        processRecording(type, chunks);
      };

      mediaRecorder.start();

      if (type === "name") {
        setNameRecording({
          isRecording: true,
          chunks: [],
          recorder: mediaRecorder,
        });
        setNameStatus("Recording...");
      } else {
        setQueryRecording({
          isRecording: true,
          chunks: [],
          recorder: mediaRecorder,
        });
        setQueryStatus("Recording...");
      }
    } catch (error) {
      console.error(`Error starting ${type} recording:`, error);
      if (type === "name") {
        setNameStatus("Error accessing microphone.");
      } else {
        setQueryStatus("Error accessing microphone.");
      }
    }
  };

  // Function to stop recording
  const stopRecording = (type: "name" | "query") => {
    if (type === "name" && nameRecording.recorder) {
      nameRecording.recorder.stop();
      nameRecording.recorder.stream
        .getTracks()
        .forEach((track) => track.stop());
      setNameRecording((prev) => ({ ...prev, isRecording: false }));
      setNameStatus("Processing audio...");
      setNameProcessing(true);
    } else if (type === "query" && queryRecording.recorder) {
      queryRecording.recorder.stop();
      queryRecording.recorder.stream
        .getTracks()
        .forEach((track) => track.stop());
      setQueryRecording((prev) => ({ ...prev, isRecording: false }));
      setQueryStatus("Processing audio...");
      setQueryProcessing(true);
    }
  };

  // Function to process recording
  const processRecording = async (type: "name" | "query", chunks: Blob[]) => {
    const audioBlob = new Blob(chunks, { type: "audio/wav" });
    const formData = new FormData();
    formData.append("audio", audioBlob);

    try {
      if (type === "name") {
        const response = await fetch("http://127.0.0.1:5000/ey_get_name", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        setNameProcessing(false);

        if (data.error) {
          setNameStatus(data.error);
          console.error(data.error);
          return;
        }

        setNameStatus(`${data.message}`);
      } else if (type === "query") {
        const response = await fetch("http://127.0.0.1:5000/ey_query", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        setQueryProcessing(false);

        if (data.error) {
          setQueryStatus(data.error);
          console.error(data.error);
          return;
        }

        setQueryStatus(`Query: ${data.query || "No query available."}`);
        setResponse(data.response || "No response available.");
        setDetectedLanguageCode(data.language_code || "en");
        if (data.response) setShowPlayButton(true);
      }
    } catch (error) {
      console.error(`Error processing ${type} recording:`, error);
      if (type === "name") {
        setNameProcessing(false);
        setNameStatus("Error processing audio.");
      } else if (type === "query") {
        setQueryProcessing(false);
        setQueryStatus("Error processing query.");
      }
    }
  };

  // Function to set literacy level
  const handleSetLiteracyLevel = async (
    level: "poor" | "good" | "very good"
  ) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/ey_set_literacy_level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ literacy_level: level }),
      });

      const data = await response.json();
      console.log(data.message);
      setLiteracyLevel({
        value: level,
        label: data.message || `Status: Literacy level set to ${level}.`,
      });
    } catch (error) {
      console.error("Error setting literacy level:", error);
      setLiteracyLevel({
        value: null,
        label: "Status: Error setting literacy level.",
      });
    }
  };
  const newsArray = [
    "India's gross GST collections rose by 9.1% year-on-year in February, reaching ₹1.83 lakh crore, reflecting an economic rebound. This increase in GST collections is expected to boost government revenues, which can be utilized for rural development initiatives.",
    "Retail inflation for farm and rural workers eased to 5.01 per cent and 5.05 per cent in December from 5.35 per cent and 5.47 per cent, respectively. This decline in inflation rates is likely to increase the purchasing power of rural households, enabling them to allocate more resources to essential expenses.",
    "Rural spending may soon align with urban markets, with packaged food and dining out expected to see increased allocation. In rural areas, the allocation for these expenses is projected to rise from 9.4% to 11.3%, while in urban areas, it is expected to increase from 10.6% to 12.3%.",
    "Rural India will propel internet users to over 900 million in 2025, finds a recent study. This rapid growth in internet penetration is expected to bridge the digital divide between urban and rural areas, providing rural residents with access to various online services and opportunities.",
    "The budget is likely to prioritize rural roads, with the PMGSY allocation expected to rise by 10%. This increased investment in rural infrastructure will improve connectivity, facilitate trade, and enhance the overall quality of life in rural areas.",
    "Rural poverty has plunged from 25.7 per cent to 4.86 per cent over 12 years, a testament to targeted interventions. This significant decline in poverty rates is a result of effective government policies and initiatives aimed at promoting rural development and inclusive growth.",

  ];


  // Function to play response
  const playResponse = async () => {
    try {
      const apiResponse = await fetch("http://127.0.0.1:5000/ey_play_response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: response,
          language_code: detectedLanguageCode,
        }),
      });

      // console.log(apiResponse.blob())

      if (!apiResponse.ok) {
        console.error("Error generating audio response.");
        return;
      }

      const audioBlob = await apiResponse.blob();
      console.log(audioBlob);
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log(audioUrl);

      if (responseAudioRef.current) {
        responseAudioRef.current.src = audioUrl;
        responseAudioRef.current.play();
        setIsPlayingResponse(true);
      }
    } catch (error) {
      console.error("Error playing response:", error);
    }
  };

  // Function to stop response playback
  const stopResponse = () => {
    if (responseAudioRef.current) {
      responseAudioRef.current.pause();
      responseAudioRef.current.currentTime = 0;
      setIsPlayingResponse(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activePage="rural-financial-news" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 bg-gradient-to-b from-black to-gray-900 pt-20">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-12">
              <span className="text-[#fccd03]">📢 Rural India</span> Financial
              Updates
            </h1>

            {/* Latest News Section */}
            <div className="flex gap-8">
              {/* <div className="bg-gradient-to-br from-black to-gray-900 rounded-2xl p-8 mb-8 border border-white/10 transition-all duration-500 hover:scale-105"> */}
              <div className="bg-gradient-to-br from-black to-gray-900 rounded-2xl p-8 mb-8 border border-white/10 transition-all duration-500 hover:scale-105">
                <div className="relative">
                  <h2 className="text-2xl font-bold text-[#fccd03] mb-6">
                    📜 Latest News
                  </h2>
                  <div className="text-gray-400 leading-relaxed whitespace-pre-line">
                    {/* {egnlishItems.map((newsItem, index) => (
                      // <div key={index} className="text-[#ffffff] shadow-sm p-4 mb-4 border border-white/10 rounded-lg">
                      //   {newsItem}
                      // </div>
                      <div className="max-w-full rounded-lg overflow-hidden shadow-lg bg-white">
                        <div className="px-6 py-4">
                          <h2 className="font-bold text-xl mb-2">{newsItem.headline}</h2>
                          <p className="text-gray-700 text-base mb-4">
                            {newsItem.content}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {newsItem.publishDate}
                          </p>
                        </div>
                      </div>
                    ))} */}
                    <div
                        className="overflow-hidden mt-10 h-[600px] w-full"
                        onMouseEnter={() => {
                          setIsEnglishNewsHovered(true);
                          controls.stop();
                        }}
                        onMouseLeave={() => {
                          setIsEnglishNewsHovered(false);
                          controls.start({
                            y: ["0%", "-100%"],
                            transition: { repeat: Infinity, ease: "linear", duration: 50 },
                          });
                        }}
                      >
                        <motion.div
                          className="flex flex-col gap-4"
                          animate={controls}
                          initial={{ y: "0%" }}
                        >
                          {articles.concat(articles).map((item, index) => (
                            <div key={index} className="w-full rounded-lg overflow-hidden shadow-lg bg-gradient-to-br from-black to-gray-900 border border-white/10 mb-4">
                              <div className="px-6 py-4">
                                <h2 className="font-bold text-xl mb-2 text-[#fccd03]">{item.heading}</h2>
                                <p className="text-gray-300 text-base mb-4">
                                  {item.desc}
                                </p>
                                {/* <p className="text-gray-500 text-sm">
                                  {item.publishDate}
                                </p> */}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-[#fccd03] rounded-xl p-3">
                    <svg
                      className="w-6 h-6 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {/* </div> */}

              {/* Today's Keywords Section */}
              {/* <div className="bg-gradient-to-br from-black to-gray-900 rounded-2xl p-8 border border-white/10 transition-all duration-500 hover:scale-105"> */}
              <div className="relative">
                <h2 className="text-2xl font-bold text-[#fccd03] mb-6">
                  🔑 Words of the day
                </h2>
                {/* <Stack decodedLanguage={detectedLanguageCode} keywords={keyWords}/> */}
                <StackOld decodedLanguage={detectedLanguageCode}/>
                {/* <ul className="space-y-4">
                    {keywords.map((keyword, index) => {
                      const parts = keyword.split(':');
                      return (
                        <li key={index} className="text-gray-400 flex items-center space-x-2 transition-all duration-300 hover:text-white hover:translate-x-2">
                          <span className="w-2 h-2 bg-[#fccd03] rounded-full"></span>
                          <span>
                            {parts.length > 1 ? (
                              <>
                                <strong className="text-[#fccd03]">{parts[0]}:</strong>{parts.slice(1).join(':')}
                              </>
                            ) : (
                              keyword
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul> */}
                {/* <div className="absolute -bottom-4 -right-4 bg-[#fccd03] rounded-xl p-3">
                  <svg
                    className="w-6 h-6 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div> */}
              </div>
              {/* </div> */}
            </div>

            
            <div className="mt-10">
              <h1 className="text-[#fccd03] text-3xl font-extrabold mb-6 text-center relative group animate-pulse flex items-center justify-center">
                <div className="h-0.5 bg-gradient-to-r from-transparent to-[#fccd03] w-16 md:w-32 mr-4"></div>
                <span className="bg-gradient-to-r from-[#fccd03] to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
                  📈 Market Trends & Graphs
                </span>
                <div className="h-0.5 bg-gradient-to-l from-transparent to-[#fccd03] w-16 md:w-32 ml-4"></div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[#fccd03] rounded-full group-hover:w-48 transition-all duration-500"></div>
              </h1>
              <NewGraphs />
            </div>

            



            {/* <div className="mt-10">
              <h1 className="text-[#fccd03] text-3xl font-extrabold mb-6 text-center relative group animate-pulse flex items-center justify-center">
                <div className="h-0.5 bg-gradient-to-r from-transparent to-[#fccd03] w-16 md:w-32 mr-4"></div>
                <span className="bg-gradient-to-r from-[#fccd03] to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
                  Breaking News 🔥
                </span>
                <div className="h-0.5 bg-gradient-to-l from-transparent to-[#fccd03] w-16 md:w-32 ml-4"></div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[#fccd03] rounded-full group-hover:w-48 transition-all duration-500"></div>
              </h1>
              <InfiniteSlider />
            </div> */}
            <div className="mt-16">
              <h1 className="text-[#fccd03] text-3xl font-extrabold mb-6 text-center relative group flex items-center justify-center">
                <div className="h-0.5 bg-gradient-to-r from-transparent to-[#fccd03] w-16 md:w-32 mr-4"></div>
                <span className="bg-gradient-to-r from-[#fccd03] to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
                  ✨ Expert Financial Insights ✨
                </span>
                <div className="h-0.5 bg-gradient-to-l from-transparent to-[#fccd03] w-16 md:w-32 ml-4"></div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[#fccd03] rounded-full group-hover:w-48 transition-all duration-500"></div>
              </h1>
              <SliderYouTube youtubeIndex={youtubeIndex} />
            </div>


          </div>
        </main>

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
          className={`fixed bottom-24 right-8 w-[600px] h-[700px] bg-black rounded-lg shadow-2xl border border-white/10 z-50 transition-all duration-300 ease-in-out transform ${isChatOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8 pointer-events-none"
            }`}
        >
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-[#fccd03] font-bold">
                Rural Financial Assistant
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
                {queryStatus}
              </p>
              {queryProcessing && (
                <div className="mx-auto my-4 w-8 h-8 border-4 border-[#fccd03] border-t-[#e3b902] rounded-full animate-spin"></div>
              )}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-2 mt-6 text-white transition-all duration-300 hover:shadow-2xl hover:shadow-[#fccd03]/20 hover:scale-[1.02] hover:-translate-y-1 active:scale-95">
                {/* <h2 className="text-3xl font-bold text-[#fccd03] mb-6 transition-transform duration-300 hover:translate-x-2">Response</h2> */}

                <div className="bg-black/30 rounded-lg p-8 mb-8 min-h-[300px] font-medium text-lg leading-relaxed transition-all duration-300 hover:bg-black/40">
                  {response}
                </div>

                <div className="flex gap-4">
                  {showPlayButton && !isPlayingResponse && (
                    <button
                      onClick={playResponse}
                      className="flex-1 bg-[#fccd03] text-black px-6 py-4 rounded-lg font-semibold hover:bg-[#e3b902] transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl shadow-[#fccd03]/20"
                    >
                      🔊 Play Response
                    </button>
                  )}

                  {isPlayingResponse && (
                    <button
                      onClick={stopResponse}
                      className="flex-1 bg-red-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl"
                    >
                      ⏹ Stop Response
                    </button>
                  )}

                  <audio ref={responseAudioRef} />
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-white/10 mt-auto">
              <div className="flex flex-wrap gap-2 justify-center items-center">
                <div className="flex gap-2 mr-4">
                  <button
                    onClick={(e) => {
                      e.currentTarget.classList.toggle("bg-green-500");
                      handleSetLiteracyLevel("poor");
                    }}
                    className="bg-[#fccd03] text-black rounded-lg px-3 py-1.5 transition-colors duration-200 flex-1 min-w-[60px] max-w-[80px] text-sm"
                  >
                    Poor
                  </button>
                  <button
                    onClick={(e) => {
                      e.currentTarget.classList.toggle("bg-green-500");
                      handleSetLiteracyLevel("good");
                    }}
                    className="bg-[#fccd03] text-black rounded-lg px-3 py-1.5 transition-colors duration-200 flex-1 min-w-[60px] max-w-[80px] text-sm"
                  >
                    Good
                  </button>
                  <button
                    onClick={(e) => {
                      e.currentTarget.classList.toggle("bg-green-500");
                      handleSetLiteracyLevel("very good");
                    }}
                    className="bg-[#fccd03] text-black rounded-lg px-3 py-1.5 transition-colors duration-200 flex-1 min-w-[80px] max-w-[80px] text-sm"
                  >
                    Excellent
                  </button>
                </div>
                {!queryRecording.isRecording ? (
                  <button
                    onClick={() => startRecording("query")}
                    className="bg-[#fccd03] text-black px-3 py-3 rounded-full font-semibold hover:bg-[#e3b902] transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl shadow-[#fccd03]/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => stopRecording("query")}
                    className="bg-red-500 text-white px-3 py-3 rounded-full font-semibold hover:bg-red-600 transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl"
                  >
                    ⏹
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuralFinancialNews;
