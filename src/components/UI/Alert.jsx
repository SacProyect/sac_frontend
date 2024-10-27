import React, { useEffect } from 'react';
import { Dialog } from 'react-aria-components';
import { DialogTrigger } from 'react-aria-components';
import { Popover, Button } from 'react-aria-components';

const Alert = ({ message, isOpen, onClose, timeout = 3000 }) => {
	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => {
				onClose();
			}, timeout);

			// Cleanup the timer on unmount or when isOpen changes
			return () => clearTimeout(timer);
		}
	}, [isOpen, onClose, timeout]);

	if (!isOpen) return null;

	return (
		<DialogTrigger isOpen={isOpen} className={"justify-self-center self-center"}>
			<Button className={"hidden"} ></Button>
			<Popover onClose={onClose} placement="bottom" className={"origin-center"}>
				<Dialog>
					<div className="bg-green-500 text-white p-4 rounded-lg shadow-lg">
						<p>{message}</p>
					</div>
				</Dialog>
			</Popover>
		</DialogTrigger>
	);
};

export default Alert;