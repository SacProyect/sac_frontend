import { useEffect } from 'react';

type AlertProps = {
	message: string;
	isOpen: boolean;
	onClose: () => void;
	timeout?: number;
};

const Alert = ({ message, isOpen, onClose, timeout = 3000 }: AlertProps) => {
	useEffect(() => {
		if (!isOpen) return;
		const timer = setTimeout(() => {
			onClose();
		}, timeout);
		return () => clearTimeout(timer);
	}, [isOpen, onClose, timeout]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
			<div className="pointer-events-auto p-4 text-white bg-green-500 rounded-lg shadow-lg">
				<p>{message}</p>
			</div>
		</div>
	);
};

export default Alert;
