// src/pages/Info/Contact.tsx

import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const Contact = () => {

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 relative overflow-hidden">
            {/* Decorative blur circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-block bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg px-8 py-6 border border-blue-100">
                        <h1 className="text-4xl font-bold text-text mb-4">
                            Liên hệ với chúng tôi
                        </h1>
                        <p className="text-text-light">
                            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
                        </p>
                        <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Contact Info */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 border border-blue-100">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                            Thông tin liên hệ
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Address */}
                            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-blue-100">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                    <MapPin className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text mb-1">Địa chỉ</h3>
                                    <p className="text-text-light">FPT Software</p>
                                    <p className="text-text-light">Khu đô thị FPT City, Đà Nẵng</p>
                                    <p className="text-text-light">Việt Nam</p>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-green-50 to-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-green-100">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                                    <Phone className="text-green-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text mb-1">Điện thoại</h3>
                                    <p className="text-text-light">Hotline: (028) 1234 5678</p>
                                    <p className="text-text-light">Di động: 0909 123 456</p>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-purple-100">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                                    <Mail className="text-purple-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text mb-1">Email</h3>
                                    <p className="text-text-light">library@example.com</p>
                                    <p className="text-text-light">support@example.com</p>
                                </div>
                            </div>

                            {/* Working Hours */}
                            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-amber-50 to-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-amber-100">
                                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                                    <Clock className="text-amber-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text mb-1">Giờ làm việc</h3>
                                    <p className="text-text-light">Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                                    <p className="text-text-light">Thứ 7 - CN: 9:00 - 17:00</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Google Maps */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-blue-100">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 px-4 pt-4">
                            Vị trí trên bản đồ
                        </h2>
                        <div className="rounded-lg overflow-hidden">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3835.6172844545444!2d108.25093287586784!3d15.975264284690857!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3142108997dc971f%3A0x1295the2a5523e88!2sFPT%20Software%20Danang!5e0!3m2!1svi!2s!4v1733063200000!5m2!1svi!2s"
                                width="100%"
                                height="400"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="FPT Software Đà Nẵng - FPT City Location"
                            ></iframe>
                        </div>
                    </div>

                    {/* Contact Note */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 border-l-4 border-blue-500">
                        <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Mail className="text-blue-600" size={20} />
                            </div>
                            Cần hỗ trợ?
                        </h3>
                        <p className="text-text-light mb-4">
                            Vui lòng liên hệ với chúng tôi qua các kênh bên trên. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
                        </p>
                        <div className="space-y-2 text-sm text-text-light">
                            <p className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>Hotline phản hồi trong 24/7</span>
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>Email phản hồi trong vòng 24 giờ</span>
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>Hoặc đến trực tiếp văn phòng trong giờ làm việc</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
