import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  details: string[];
}

export default function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Comprehensive Driver Management</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our advanced system combines real-time scoring, smart alerts, and detailed analytics 
            to optimize your fleet performance
          </p>
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: index * 0.1, ease: "easeOut" }}
              className="p-8 rounded-2xl shadow-xl bg-white/90 backdrop-blur-md border border-gray-100 hover:scale-[1.03] transition-transform"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{feature.title}</h3>
                  <p className="text-base text-gray-600">{feature.description}</p>
                </div>
              </div>
              <ul className="space-y-2 mt-4">
                {feature.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
