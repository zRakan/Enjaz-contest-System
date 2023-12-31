const questions = [
    [ // Round 1
        {
            title: "Which programming language is commonly used for web development?",
            options: ["Python", "Ruby", "JavaScript"],
            answer: "JavaScript"
        },

        {
            title: "What is the main component of a computer's central processing unit (CPU)?",
            options: ["Microprocessor", "Memory", "Graphics card"],
            answer: "Microprocessor"
        },

        {
            title: 'Which of the following is an example of an input device?',
            options: ['Printer', 'Keyboard', 'Speakers'],
            answer: 'Keyboard'
        },

        {
            title: 'Which of the following is an example of a cloud storage service?',
            options: ['Dropbox', 'Microsoft Word', 'VLC Media Player'],
            answer: 'Dropbox'
        },

        {
            title: 'Which of the following is not a web browser?',
            options: ['Google Chrome', 'Mozilla Firefox', 'Microsoft Excel'],
            answer: 'Microsoft Excel'
        },

        {
            title: 'Which company developed the first commercial microprocessor?',
            options: ['Intel', 'Microsoft', 'IBM'],
            answer: 'Intel'
        },

        {
            title: 'What is the purpose of a firewall in network security?',
            options: ['To protect against unauthorized access', 'To increase internet speed', 'To encrypt data transmissions'],
            answer: 'To protect against unauthorized access'
        }
    ],
    [ // Round 2
        {
            title: "What is the primary purpose of a database in computer technology?",
            options: ["Data storage", "Resource management", "User authentication"],
            answer: "Data storage"
        },
        {
            title: "What does HTML stand for?",
            options: ["Hypertext Markup Language", "High Tech Markup Language", "Hyperlink and Text Markup Language"],
            answer: "Hypertext Markup Language"
        },
        {
            title: "What is the main purpose of CSS in web development?",
            options: ["Styling and formatting", "Scripting and animation", "Data validation"],
            answer: "Styling and formatting"
        },
        {
            title: "Which JavaScript operator is used to assign a value to a variable?",
            options: ["+", "-", "*"],
            answer: "="
        },
        {
            title: "What is the main purpose of a router in a computer network?",
            options: ["Connect multiple devices", "Manage network access", "Provide Wi-Fi"],
            answer: "Connect multiple devices"
        },

        {
            title: "Which HTML tag is used to create a new paragraph?",
            options: ["<p>", "<div>", "<span>"],
            answer: "<p>"
        },

        {
            title: "Which web protocol is used for real-time communication, such as voice and video calls?",
            options: ["RTSP", "SRTP", "WebRTC"],
            answer: "WebRTC"
        }
    ],
    [ // Round 3
        {
            title: "What is the main purpose of a firewall in computer security?",
            options: ["Protecting the network", "Managing network traffic", "Monitoring network usage"],
            answer: "Protecting the network"
        },
        {
            title: 'What does CPU stand for?',
            options: ['Central Processing Unit', 'Computer Processing Unit', 'Central Power Unit', 'Computer Power Unit'],
            answer: 'Central Processing Unit'
        },

        {
            title: "Which web protocol is used for transferring hypertext documents (HTML and XML)?",
            options: ["HTTP", "HTTPS", "FTP"],
            answer: "HTTP"
        },
        {
            title: "What is the main purpose of an API (Application Programming Interface) in software development?",
            options: ["Providing a standard interface for developers", "Managing software resources", "Controlling program execution"],
            answer: "Providing a standard interface for developers"
        },
        {
            title: "Which technology is used for voice recognition and natural language processing?",
            options: ["Optical character recognition", "Speech recognition", "Handwriting recognition"],
            answer: "Speech recognition"
        },

        {
            title: "Which programming language is commonly used for mobile app development?",
            options: ["Python", "Ruby", "JavaScript", "Swift"],
            answer: "Swift"
        },
        {
            title: "What is the main purpose of a proxy server in computer networking?",
            options: ["Caching web content", "Load balancing", "Security and privacy"],
            answer: "Security and privacy"
        },
    ],
    [ // Round 4
        {
            title: "What is the main purpose of a content management system (CMS) in web development?",
            options: ["Managing website content", "Creating website layouts", "Handling website security"],
            answer: "Managing website content"
        },
        {
            title: "What is the main purpose of a virtual private network (VPN) in computer security?",
            options: ["Encrypting data", "Hiding IP addresses", "Providing remote access"],
            answer: "Hiding IP addresses"
        },

        {
            title: "Which programming language is commonly used for machine learning and artificial intelligence?",
            options: ["Python", "R", "JavaScript"],
            answer: "Python"
        },
        {
            title: "What is the main purpose of a content delivery network (CDN) in web performance?",
            options: ["Caching web content", "Distributing content globally", "Load balancing"],
            answer: "Caching web content"
        },
        {
            title: "Which technology is used for creating interactive and dynamic web pages?",
            options: ["HTML", "CSS", "JavaScript"],
            answer: "JavaScript"
        },
        {
            title: "What is the main purpose of a web server in computer networking?",
            options: ["Hosting web content", "Managing network traffic", "Providing security"],
            answer: "Hosting web content"
        },
        {
            title: "Which web protocol is used for secure communication between a user's browser and a server?",
            options: ["HTTP", "HTTPS", "FTP"],
            answer: "HTTPS"
        }
    ],
    [ // Round 5
        {
            title: "What is the main purpose of a domain name system (DNS) in computer networking?",
            options: ["Translating domain names to IP addresses", "Managing network resources", "Providing email services"],
            answer: "Translating domain names to IP addresses"
        },
        {
            title: "What is the main purpose of a load balancer in computer networking?",
            options: ["Distributing network traffic", "Managing network security", "Monitoring network performance"],
            answer: "Distributing network traffic"
        },
        {
            title: "Which technology is used for creating dynamic and interactive web pages?",
            options: ["HTML", "CSS", "JavaScript"],
            answer: "JavaScript"
        },
        {
            title: "Which programming language is commonly used for data analysis and visualization?",
            options: ["Python", "R", "JavaScript"],
            answer: "Python"
        },
        {
            title: "Which technology is used for creating responsive and adaptive layouts in web design?",
            options: ["HTML", "CSS", "JavaScript"],
            answer: "CSS"
        },
        {
            title: "What is the main purpose of a version control system (VCS) in software development?",
            options: ["Managing source code changes", "Testing software functionality", "Deploying software to production"],
            answer: "Managing source code changes"
        },
        {
            title: "Which protocol is used for transferring files between devices on a local network?",
            options: ["FTP", "FTPS", "HTTP"],
            answer: "FTP"
        }
    ]
]

// Initialize answers
const answers = {};
let id = 1;

for(let questionSet of questions) {
    for(let question in questionSet) {
        const ques = questionSet[question]
        ques.id = ++id;

        answers[ques.id] = ques.answer;
    }
}

export function getQuestions() {
    return questions;
}

export function getAnswers() {
    return answers;
}

console.log(questions);