import React from 'react';
import { GameState } from '../types';
import { ArrowLeft, Smartphone, FileText, Coffee, AlertTriangle, Utensils, MessageCircle, Search } from 'lucide-react';

interface Props {
  setGameState: (state: GameState) => void;
}

const Rules: React.FC<Props> = ({ setGameState }) => {
  return (
    <div className="h-full w-full bg-white text-slate-900 overflow-y-auto relative">
      <div className="p-8">
        <button 
          onClick={() => setGameState(GameState.MENU)}
          className="flex items-center gap-2 font-bold text-lg mb-8 hover:underline sticky top-0 bg-white/95 backdrop-blur-sm py-4 z-10 w-full border-b border-transparent transition-all"
        >
          <ArrowLeft /> 返回首页
        </button>

        <div className="max-w-5xl mx-auto pb-24">
          <h2 className="text-5xl font-black mb-8">游戏规则</h2>
          
          <div className="mb-8 p-8 bg-blue-50 rounded-2xl border-l-8 border-blue-500 shadow-sm">
            <h3 className="text-3xl font-bold mb-4">操作方式</h3>
            <p className="text-xl">使用摄像头捕捉你的头部移动。用鼻子控制画面中的角色移动！</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">核心数值</h3>
              <ul className="space-y-6 text-lg">
                <li className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">活</div>
                   <span><strong>活力:</strong> 初始100%。归零则失败。活力越低移动越慢。</span>
                </li>
                <li className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">作</div>
                   <span><strong>作业完成度:</strong> 初始0%。达到100%直接胜利。</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold mb-6">时间阶段 (60秒)</h3>
              <ul className="space-y-4 text-lg">
                <li>☀️ <strong>白天 (1-20s):</strong> 轻松阶段，积累资源。</li>
                <li>🌇 <strong>傍晚 (21-40s):</strong> 节奏加快，诱惑增多。</li>
                <li>🌑 <strong>深夜 (41-60s):</strong> 冲刺阶段，小心弹窗！</li>
              </ul>
            </div>
          </div>

          <h3 className="text-3xl font-bold mb-6">物品图鉴</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            
            <div className="p-6 border-2 rounded-xl hover:shadow-lg transition bg-blue-50 border-blue-100">
               <div className="flex items-center gap-3 font-bold mb-3 text-blue-700 text-xl"><FileText size={32}/> 资料</div>
               <p className="text-base font-medium text-blue-900/80">增加 10% 作业进度。</p>
            </div>

            <div className="p-6 border-2 rounded-xl hover:shadow-lg transition bg-indigo-50 border-indigo-100">
               <div className="flex items-center gap-3 font-bold mb-3 text-indigo-700 text-xl"><Search size={32}/> 查资料</div>
               <p className="text-base font-medium text-indigo-900/80">大幅增加 20% 作业进度，但需要停下来搜索 3 秒。</p>
            </div>

            <div className="p-6 border-2 rounded-xl hover:shadow-lg transition bg-orange-50 border-orange-100">
               <div className="flex items-center gap-3 font-bold mb-3 text-orange-600 text-xl"><Utensils size={32}/> 零食</div>
               <p className="text-base font-medium text-orange-900/80">恢复 10% 活力。保持体力的关键。</p>
            </div>

            <div className="p-6 border-2 rounded-xl hover:shadow-lg transition bg-yellow-50 border-yellow-100">
               <div className="flex items-center gap-3 font-bold mb-3 text-yellow-600 text-xl"><Utensils size={32}/> 晚饭</div>
               <p className="text-base font-medium text-yellow-900/80">恢复 30% 活力！但很美味，会让你停下来享受 1.5 秒。</p>
            </div>

            <div className="p-6 border-2 rounded-xl hover:shadow-lg transition bg-purple-50 border-purple-100">
               <div className="flex items-center gap-3 font-bold mb-3 text-purple-600 text-xl"><Smartphone size={32}/> 手机</div>
               <p className="text-base font-medium text-purple-900/80">诱惑！会让你停下来玩 1.5 秒并消耗 10% 活力。</p>
            </div>

            <div className="p-6 border-2 rounded-xl hover:shadow-lg transition bg-green-50 border-green-100">
               <div className="flex items-center gap-3 font-bold mb-3 text-green-600 text-xl"><MessageCircle size={32}/> 社交通知</div>
               <p className="text-base font-medium text-green-900/80">赌一把！50%概率获得有效消息(+20%进度)，或无效八卦(-20%活力)。</p>
            </div>

            <div className="p-6 border-2 rounded-xl hover:shadow-lg transition bg-amber-50 border-amber-100">
               <div className="flex items-center gap-3 font-bold mb-3 text-amber-800 text-xl"><Coffee size={32}/> 咖啡</div>
               <p className="text-base font-medium text-amber-900/80">深夜阶段出现，增加 10% 活力。</p>
            </div>

            <div className="p-6 border-2 rounded-xl hover:shadow-lg transition bg-red-50 border-red-100">
               <div className="flex items-center gap-3 font-bold mb-3 text-red-600 text-xl"><AlertTriangle size={32}/> 催促弹窗</div>
               <p className="text-base font-medium text-red-900/80">深夜出现的障碍物，会阻挡你的去路！不可拾取。</p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rules;